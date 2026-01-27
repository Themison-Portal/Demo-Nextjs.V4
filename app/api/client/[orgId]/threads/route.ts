/**
 * Client - Threads API Route
 * GET: Get threads for organization
 * POST: Create new thread with first message
 */

import { createClient } from "@/lib/supabase/server";
import { withOrgMember } from "@/lib/api/middleware";
import { validateTrialAccess } from "@/lib/api/helpers/validateTrialAccess";

/**
 * GET /api/client/[orgId]/threads
 * Get threads where user is a participant
 *
 * Query params:
 * - trial_id: Filter by trial
 * - unread_only: Filter unread threads
 *
 * Access:
 * - Users see only threads where they are participants (via RLS)
 */
export const GET = withOrgMember(async (req, ctx, user) => {
  const { orgId } = ctx.params;
  const supabase = await createClient();

  // Parse query params
  const url = new URL(req.url);
  const trialIdFilter = url.searchParams.get("trial_id");
  const unreadOnly = url.searchParams.get("unread_only") === "true";

  // Build query - RLS automatically filters to user's threads
  let query = supabase
    .from("message_threads")
    .select(
      `
      *,
      participants:thread_participants(
        user_id,
        participant_type,
        last_read_message_id,
        user:users(id, email, full_name)
      ),
      messages:messages(
        id,
        content,
        sent_at,
        sent_by,
        sender:users!messages_sent_by_fkey(id, email, full_name),
        attachments:message_attachments(
          id,
          attachment_type,
          task_id,
          response_snapshot,
          task:tasks(id, title, status, assigned_to, description, due_date)
        )
      ),
      creator:users!message_threads_created_by_fkey(id, email, full_name),
      trial:trials(id, name)
    `,
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (trialIdFilter) {
    query = query.eq("trial_id", trialIdFilter);
  }

  const { data: threads, error } = await query;

  if (error) {
    console.error("[API] Error fetching threads:", error);
    return Response.json({ error: "Failed to fetch threads" }, { status: 500 });
  }

  // Filter unread threads if requested
  let filteredThreads = threads || [];
  if (unreadOnly) {
    filteredThreads = filteredThreads.filter((thread: any) => {
      const userParticipant = thread.participants?.find(
        (p: any) => p.user_id === user.id,
      );
      return userParticipant && !userParticipant.read_at;
    });
  }

  // Sort messages within each thread by sent_at
  filteredThreads = filteredThreads.map((thread: any) => ({
    ...thread,
    messages: (thread.messages || []).sort(
      (a: any, b: any) =>
        new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime(),
    ),
  }));

  return Response.json(filteredThreads);
});

/**
 * POST /api/client/[orgId]/threads
 * Create a new thread with first message
 *
 * Body:
 * - trial_id: Trial context
 * - subject: Thread subject
 * - content: First message content
 * - to_users: Array of user_ids (recipients)
 * - cc_users: Array of user_ids (optional, copied users)
 * - attachment: Optional { type: 'task', task_id } or { type: 'response', response_snapshot }
 */
export const POST = withOrgMember(async (req, ctx, user) => {
  const { orgId } = ctx.params;
  const supabase = await createClient();

  // Parse request body
  let input: any;
  try {
    input = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { trial_id, subject, content, to_users, cc_users, attachment } = input;

  // Validate required fields
  if (!subject || !content || !to_users || to_users.length === 0) {
    return Response.json(
      { error: "subject, content, and to_users are required" },
      { status: 400 },
    );
  }

  // Verify trial exists and belongs to org (if trial_id is provided)
  if (trial_id) {
    const { data: trial, error: trialError } = await supabase
      .from("trials")
      .select("id")
      .eq("id", trial_id)
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .single();

    if (trialError || !trial) {
      return Response.json({ error: "Trial not found" }, { status: 404 });
    }

    // Validate trial access for all recipients (TO + CC)
    const allRecipients = [...to_users, ...(cc_users || [])];

    if (allRecipients.length > 0) {
      try {
        const validation = await validateTrialAccess(
          supabase,
          orgId,
          trial_id,
          allRecipients,
        );

        if (validation.invalid_users.length > 0) {
          const invalidNames = validation.invalid_users
            .map((u) => u.full_name || u.email)
            .join(", ");
          return Response.json(
            {
              error: `These users don't have access to this trial: ${invalidNames}`,
            },
            { status: 403 },
          );
        }
      } catch (error: any) {
        console.error("[API] Error validating recipients:", error);
        return Response.json(
          { error: "Failed to validate recipient access" },
          { status: 500 },
        );
      }
    }
  }

  // Step 1: Create thread
  const { data: thread, error: threadError } = await supabase
    .from("message_threads")
    .insert({
      trial_id: trial_id || null,
      subject: subject.trim(),
      created_by: user.id,
    })
    .select()
    .single();

  if (threadError) {
    console.error("[API] Error creating thread:", threadError);
    return Response.json({ error: "Failed to create thread" }, { status: 500 });
  }

  // Step 2: Create participants (TO + CC + Creator)
  const allRecipientIds = [...to_users, ...(cc_users || [])];
  const creatorIsParticipant = allRecipientIds.includes(user.id);

  const participants = [
    ...to_users.map((userId: string) => ({
      thread_id: thread.id,
      user_id: userId,
      participant_type: "to" as const,
    })),
    ...(cc_users || []).map((userId: string) => ({
      thread_id: thread.id,
      user_id: userId,
      participant_type: "cc" as const,
    })),
    // Always add creator as participant if not already included
    ...(!creatorIsParticipant
      ? [
          {
            thread_id: thread.id,
            user_id: user.id,
            participant_type: "to" as const,
          },
        ]
      : []),
  ];

  const { error: participantsError } = await supabase
    .from("thread_participants")
    .insert(participants);

  if (participantsError) {
    console.error("[API] Error creating participants:", participantsError);
    // Rollback thread (soft delete)
    await supabase
      .from("message_threads")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", thread.id);

    return Response.json(
      { error: "Failed to create thread participants" },
      { status: 500 },
    );
  }

  // Step 3: Create first message
  const { data: message, error: messageError } = await supabase
    .from("messages")
    .insert({
      thread_id: thread.id,
      sent_by: user.id,
      content: content.trim(),
    })
    .select()
    .single();

  if (messageError) {
    console.error("[API] Error creating message:", messageError);
    // Rollback thread (soft delete)
    await supabase
      .from("message_threads")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", thread.id);

    return Response.json(
      { error: "Failed to create message" },
      { status: 500 },
    );
  }

  // Step 3.5: Mark creator as having read the first message (they just created it)
  await supabase
    .from("thread_participants")
    .update({ last_read_message_id: message.id })
    .eq("thread_id", thread.id)
    .eq("user_id", user.id);

  // Step 4: Create attachment if provided
  if (attachment) {
    const attachmentData =
      attachment.type === "task"
        ? {
            message_id: message.id,
            attachment_type: "task" as const,
            task_id: attachment.task_id,
            response_snapshot: null,
          }
        : {
            message_id: message.id,
            attachment_type: "response" as const,
            task_id: null,
            response_snapshot: attachment.response_snapshot,
          };

    const { error: attachmentError } = await supabase
      .from("message_attachments")
      .insert(attachmentData);

    if (attachmentError) {
      console.error("[API] Error creating attachment:", attachmentError);
      // Rollback thread (soft delete)
      await supabase
        .from("message_threads")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", thread.id);

      return Response.json(
        { error: "Failed to create message attachment" },
        { status: 500 },
      );
    }
  }

  // Step 5: Fetch complete thread with relations
  const { data: completeThread } = await supabase
    .from("message_threads")
    .select(
      `
      *,
      participants:thread_participants(
        user_id,
        participant_type,
        last_read_message_id,
        user:users(id, email, full_name)
      ),
      messages:messages(
        id,
        content,
        sent_at,
        sent_by,
        sender:users!messages_sent_by_fkey(id, email, full_name),
        attachments:message_attachments(
          id,
          attachment_type,
          task_id,
          response_snapshot,
          task:tasks(id, title, status, assigned_to, description, due_date)
        )
      ),
      creator:users!message_threads_created_by_fkey(id, email, full_name),
      trial:trials(id, name)
    `,
    )
    .eq("id", thread.id)
    .single();

  return Response.json(completeThread, { status: 201 });
});
