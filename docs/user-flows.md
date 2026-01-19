# Clinical Trials Management System - User Flows
**Version:** 2.0 (Updated with Permissions)  
**Date:** January 5, 2026  
**Status:** Ready for DB Schema Design

---

## CORE DECISIONS

### Roles
**Organization Roles (fixed):**
- `superadmin` - Full access, can assign any role, can delete org/users
- `admin` - Full access within organization, CANNOT delete org/users
- `editor` - Can work within assigned trials, cannot manage members
- `reader` - View only in assigned trials

**Trial Roles (fixed defaults + custom):**
- `PI` - Principal Investigator (elevated permissions for critical actions)
- `CRC` - Clinical Research Coordinator (elevated permissions for critical actions)
- `Physician` - Descriptive role
- `Nurse` - Descriptive role
- `Lab Technician` - Descriptive role
- Custom role name (text field for non-standard roles)

**Staff Role (Themison only):**
- `staff` - Themison employees, access organizations via support mode

### Task Types (fixed)
- `LB` - Laboratory
- `VS` - Vital Signs
- `PE` - Physical Exam
- `SA` - Safety Assessment
- `AD` - Administrative

### Trial Statuses (fixed)
- `draft`
- `active`
- `completed`
- `suspended`
- `paused`

### Key Architectural Decisions
1. **Patients scope:** Patients belong to trials (not organization-wide)
2. **Support access:** Single `support_enabled` flag controls staff access to organizations
3. **Staff role:** Themison employees have separate `staff` role, act as superadmin when support enabled
4. **Multiple owners:** Organization creation supports multiple owners (all become superadmin)
5. **First owner activates:** First owner to accept invitation activates the organization
6. **Scopes:** Organization scope (create/pause trials) vs Trial scope (everything within trial)
7. **Extraordinary permission:** Superadmin and Admin have automatic access to ALL trials, acting as PI/CRC even if not in trial_team

---

## USER FLOWS (40 Total)

---

## ÁREA 1: SETUP INICIAL (Admin + Owner)

### Flow 1: Staff Creates Organization (Normal Mode)
**Actors:** Staff member  
**Trigger:** Need to onboard new client organization

**Happy Path:**
1. Staff member signs in at `/console`
2. Staff member sees list of existing organizations
3. Staff member clicks "Create Organization"
4. Staff member enters:
   - Organization name
   - Primary owner email
   - Additional owner emails (optional, 1-2 more)
   - Features enabled (JSONB array, defaults to all)
5. Staff member does NOT enable "Support" toggle
6. Staff member submits
7. System creates org with `status = pending_setup`, `support_enabled = false`
8. System sends invitation emails to ALL owners
9. Staff member sees new org in list

**Outcome:** Organization created, waiting for owner acceptance

---

### Flow 1B: Staff Creates Organization (with Support Enabled for Showcase)
**Actors:** Staff member  
**Trigger:** Staff needs to do showcase/demo for client

**Happy Path:**
1. Staff member signs in at `/console`
2. Staff member clicks "Create Organization"
3. Staff member enters organization name
4. Staff member ENABLES "Support" toggle
5. Staff member auto-assigns self as owner (email @themison.com)
6. Staff member submits
7. System creates org with `support_enabled = true`, staff member is owner
8. Staff member sees "Go to Clinic Dashboard" button next to org
9. Staff member clicks button → redirects to org dashboard
10. Staff member operates as superadmin (creates trials, invites members, etc.)
11. When showcase complete, staff member clicks "Delegate Ownership"
12. Staff member enters real owner email
13. System:
    - Sends invitation to real owner
    - Removes staff member from org
    - Keeps `support_enabled` state as-is (staff decides to keep ON or turn OFF)
14. Real owner receives invitation and follows Flow 2

**Outcome:** Staff completes showcase, real owner takes over

---

### Flow 2: Owner Accepts Invitation and Signs Up
**Actors:** Organization Owner (invited user)  
**Trigger:** Receives invitation email

**Happy Path:**
1. User receives email with magic link
2. User clicks link → auto-authenticated via magic link
3. User lands on profile completion page
4. User sets password and completes profile
5. Password stored for future logins
6. If user is FIRST owner to accept:
   - User becomes superadmin
   - Org status changes from `pending_setup` to `active`
7. If user is NOT first (additional owner):
   - User becomes superadmin (same as first)
   - Org already active
8. User redirects to organization dashboard

**Outcome:** Owner onboarded, organization active

**Note:** Future logins use regular signin at `/signin` with email + password

---

### Flow 3: Owner Invites Members to Organization
**Actors:** Superadmin or Admin  
**Trigger:** Need to add team members to organization

**Happy Path:**
1. User clicks "Invite Members"
2. User enters:
   - Email (one at a time)
   - Role: superadmin, admin, editor, reader
3. **Validation:** Only superadmin can assign superadmin role
4. User submits
5. System sends invitation email
6. Invited user receives email and follows Flow 2
7. New member appears in org members list

**Outcome:** New member added to organization

---

### Flow 4: Create Trial
**Actors:** Superadmin or Admin  
**Trigger:** Need to set up new clinical trial

**Happy Path:**
1. User clicks "Create Trial"
2. **Validation:** If no org members exist → system blocks with message "Invite members first"
3. User enters:
   - Protocol number (required)
   - Official title (required)
   - Short title
   - Description
   - Phase: Phase 1, 2, 3, 4
   - Area/Therapeutic area
   - Disease/condition being studied
   - Status: draft, active, completed, suspended
   - Sponsor
   - Principal Investigator (select from org members)
   - Sites (text input, simple string)
4. User submits
5. Trial created
6. User redirects to trial detail page
7. Trial appears in trials list
8. Trial appears in Document Assistant dropdown

**Outcome:** Trial created and ready for team assignment

**Note:** Organization scope action

---

### Flow 5: Assign Team Members to Trial
**Actors:** PI or CRC  
**Trigger:** Need to give team members access to specific trial

**Happy Path:**
1. User opens trial detail
2. User navigates to "Team" tab
3. User clicks "Assign Member"
4. User selects member from organization members list
5. User assigns trial role:
   - Select from dropdown: PI, CRC, Physician, Nurse, Lab Technician
   - OR enter custom role name in text field
6. User sets:
   - Status: Active (default)
   - Start date (default: today)
   - End date (optional)
7. User submits
8. Member appears in trial team list
9. Member now has access to this trial's data

**Outcome:** Team member assigned to trial with specific role

**Note:** Critical action within trial scope. Hybrid role approach - fixed defaults + custom text field for flexibility.

**Extraordinary permission:** Superadmin and Admin can perform this action even if not in trial_team.

---

### Flow 6: Staff Activates/Deactivates Support Mode
**Actors:** Staff member  
**Trigger:** Organization needs support from Themison team

**Happy Path (Activation):**
1. Organization owner contacts Themison for help
2. Staff member signs in to `/console`
3. Staff member finds organization in list
4. Staff member clicks "Enable Support" toggle
5. `support_enabled = true`
6. ALL staff members (@themison.com) can now access this organization as superadmin
7. Staff member (or any other staff member) clicks "Go to Organization Dashboard"
8. Staff member enters organization dashboard acting as superadmin
9. Staff member resolves issue

**Happy Path (Deactivation):**
1. Staff member finishes support work
2. Staff member returns to `/console` panel
3. Staff member clicks "Disable Support" toggle
4. `support_enabled = false`
5. All staff members lose access to organization

**Outcome:** Themison team can temporarily access organization for support

---

## ÁREA 2: PATIENT MANAGEMENT & VISITS

### Flow 7: Create Patient (lives in trial)
**Actors:** Trial team member  
**Trigger:** Need to enroll new patient in trial

**Happy Path:**
1. User navigates to trial
2. User goes to "Patients" section
3. User clicks "Add Patient"
4. User enters:
   - Patient ID (required)
   - Gender
   - Date of birth
   - Phone
   - Email
   - Address
   - Visit Start Date (triggers schedule generation)
5. User submits
6. System creates patient record linked to THIS trial (`trial_id` FK)
7. System generates visit schedule based on template (Flow 34) + start date
8. System creates tasks for each visit activity, auto-assigned per rules (Flow 35)
9. Patient Dashboard created with populated visit schedule and tasks
10. Patient appears in trial's patient list

**Outcome:** Patient enrolled in trial with complete visit schedule and auto-assigned tasks

**Note:** Patient belongs to trial, not organization-wide. Trial scope action. Visit schedule and task generation only work if trial has template (Flow 34) and assignment rules (Flow 35) configured.

**Extraordinary permission:** Superadmin and Admin can perform this action even if not in trial_team.

---

### Flow 8: View Patient Dashboard
**Actors:** Trial team member  
**Trigger:** Need to check patient status and progress

**Happy Path:**
1. User navigates to trial's Patients section
2. User sees list of patients
3. User clicks on patient
4. Patient Dashboard displays:
   - Patient ID, gender, contact info
   - Current visit (e.g., "Visit 6 - Week 12")
   - Next visit date
   - Visit requirements checklist with completion status:
     - Laboratory: 10/10 ✓
     - Vital Signs: 4/4 ✓
     - Physical Exam: 1/1 ✓
     - Safety Assessment: Pending
   - Side effects reported (with timestamps)
   - Study progress (6 out of 13 visits completed)

**Outcome:** User has complete view of patient's trial status

**Extraordinary permission:** Superadmin and Admin can perform this action even if not in trial_team.

---

### Flow 9: Create Task from Patient Dashboard
**Actors:** Trial team member  
**Trigger:** Need to assign work related to specific patient

**Happy Path:**
1. User opens Patient Dashboard
2. User navigates to visit requirements section
3. User clicks on specific requirement (e.g., "Laboratory")
4. User clicks "Create Task"
5. Task modal opens **pre-filled** with:
   - Patient linked (current patient)
   - Task type (LB - based on requirement clicked)
6. User adds:
   - Task title
   - Assign to (team member)
   - CC/Inform (optional)
   - Due date
7. User submits
8. Task appears in Task Manager for assigned user
9. Task links back to this patient
10. Task appears in Patient Dashboard

**Outcome:** Task created and linked to patient

**Extraordinary permission:** Superadmin and Admin can perform this action even if not in trial_team.

---

### Flow 34: Configure Visit Schedule Template (Manual)
**Actors:** PI or CRC  
**Trigger:** Trial created, need to define visit calendar structure

**Happy Path:**
1. User opens trial detail
2. User navigates to "Settings" → "Visit Schedule"
3. User clicks "Create Schedule Template"
4. User adds visits one by one:
   - **Visit 1** (Screening):
     - Visit name: "Screening"
     - Day offset: `0` (baseline)
     - Window: ±2 days
     - Activities: ☑ LB (Laboratory), ☑ VS (Vital Signs), ☑ PE (Physical Exam)
   - **Visit 2** (Week 4):
     - Visit name: "Week 4"
     - Day offset: `28` (from start date)
     - Window: ±3 days
     - Activities: ☑ LB, ☑ VS
   - **Visit 3** (Week 12):
     - Visit name: "Week 12"
     - Day offset: `84`
     - Window: ±3 days
     - Activities: ☑ LB, ☑ SA (Safety Assessment)
5. User can add/remove/reorder visits
6. User saves template
7. Template now available for all patients in this trial
8. When enrolling new patient (Flow 7), system will ask for "Visit Start Date"
9. System auto-generates visit schedule based on template + start date

**Outcome:** Visit schedule template defined, ready for patient enrollment

**Note:** Critical action within trial scope. Template modification does NOT affect existing patients.

**Extraordinary permission:** Superadmin and Admin can perform this action even if not in trial_team.

---

### Flow 35: Configure Task Assignment Rules
**Actors:** PI or CRC  
**Trigger:** Trial created, need to define default task assignments

**Happy Path:**
1. User opens trial detail
2. User navigates to "Settings" → "Task Assignment Rules"
3. User sees list of activity types with assignment dropdowns:
   - Laboratory (LB): [Select team member]
   - Vital Signs (VS): [Select team member]
   - Physical Exam (PE): [Select team member]
   - Safety Assessment (SA): [Select team member]
   - Administrative (AD): [Select team member]
4. User selects default assignee for each activity type from trial team members
5. User can leave some unassigned (will require manual assignment per patient)
6. User clicks "Save Rules"
7. System validates all selected users are in trial team
8. Rules saved
9. From now on, when new patient is created → tasks auto-assign according to these rules

**Outcome:** Default task assignments configured, streamlines patient enrollment workflow

**Note:** Critical action within trial scope. Rules only apply to NEW patients created after rules are set. Existing patients' tasks remain unchanged.

**Extraordinary permission:** Superadmin and Admin can perform this action even if not in trial_team.

---

### Flow 36: Generate Visit Schedule from Protocol (RAG-assisted) [FUTURE]
**Actors:** PI or CRC  
**Trigger:** Trial has protocol document uploaded, want to extract schedule automatically

**Happy Path:**
1. User opens trial detail
2. User navigates to "Settings" → "Visit Schedule"
3. User clicks "Extract from Protocol"
4. System shows list of uploaded protocol documents
5. User selects protocol PDF
6. System sends to RAG with hardcoded query: "Extract visit schedule with day offsets and required activities"
7. RAG returns structured data (visit names, offsets, activities)
8. System displays extracted schedule for review/edit
9. User can adjust visits, offsets, activities before saving
10. User saves template
11. Template available for patient enrollment

**Outcome:** Schedule extracted automatically, user validates before use

**Fallback:** If RAG extraction fails or returns poor results → redirect to manual configuration (Flow 34)

**Note:** Future feature. Critical action within trial scope.

**Extraordinary permission:** Superadmin and Admin can perform this action even if not in trial_team.

---

## ÁREA 3: DOCUMENT ASSISTANT + RESPONSE ARCHIVE

### Flow 10: Query Document and Get Response
**Actors:** Trial team member  
**Trigger:** Need information from protocol document

**Happy Path:**
1. User navigates to Document Assistant
2. User selects trial from dropdown
3. User selects document/PDF from dropdown (previously uploaded to trial)
4. User types question in query field (e.g., "What are the exclusion criteria?")
5. User clicks "Ask"
6. System processes query and returns response with citations
7. User sees 4 action buttons below response:
   - Send Response
   - Save Response
   - Export
   - Create Task

**Outcome:** User has answer from protocol document

**Extraordinary permission:** Superadmin and Admin can perform this action even if not in trial_team.

---

### Flow 11: Save Response to Archive (with folder organization)
**Actors:** Trial team member  
**Trigger:** Want to save response for later use

**Happy Path:**
1. User receives response from query (Flow 10)
2. User clicks "Save Response"
3. Modal appears with:
   - Folder dropdown (select existing OR create new)
   - Title field (name for this snippet)
4. User selects existing folder (e.g., "Visit 6 Specifications")
   - OR clicks "Create New Folder" and enters folder name
5. User enters snippet title (e.g., "Prerequisites for Visit 6")
6. User clicks "Save"
7. Snippet saved to Response Archive under selected folder

**Outcome:** Response saved and organized in folder

**Note:** Folders are personal (each user has their own).

**Extraordinary permission:** Superadmin and Admin can perform this action even if not in trial_team.

---

### Flow 12: Build Collection of Snippets
**Actors:** Trial team member  
**Trigger:** Gathering multiple pieces of information for a specific purpose

**Happy Path:**
1. User makes first query (e.g., "What are the prerequisites for visit 6?")
2. User saves response to folder "Visit 6 Specifications"
3. User makes second query (e.g., "What are the laboratory requirements?")
4. User saves response to SAME folder "Visit 6 Specifications"
5. User selects different PDF from dropdown
6. User makes third query (e.g., "What are the vital signs to measure?")
7. User saves response to SAME folder "Visit 6 Specifications"
8. User now has 3 related snippets organized in one folder
9. User never left Document Assistant during this process

**Outcome:** Collection of organized information snippets

**Extraordinary permission:** Superadmin and Admin can perform this action even if not in trial_team.

---

### Flow 13: Send Response Directly
**Actors:** Trial team member  
**Trigger:** Need to share information with colleague immediately

**Happy Path:**
1. User receives response from query (Flow 10)
2. User clicks "Send Response"
3. Modal appears with:
   - To field (select team member - recipient)
   - CC field (select team members to inform - optional)
   - Message field (add context - optional)
4. User selects recipient and optionally CC
5. User optionally adds contextual message
6. User clicks "Send"
7. Message with response content appears in Communication Hub for all tagged users

**Outcome:** Information shared with team via Communication Hub

**Extraordinary permission:** Superadmin and Admin can perform this action even if not in trial_team.

---

### Flow 14: Create Task from Response
**Actors:** Trial team member  
**Trigger:** Response contains actionable information

**Happy Path:**
1. User receives response from query (Flow 10)
2. User clicks "Create Task"
3. Modal appears with:
   - Task title
   - Assign to (team member responsible)
   - CC/Inform (team members to notify)
   - Due date
   - Patient (optional - select from trial patients)
   - Task type: LB, VS, PE, SA, AD
4. User fills fields
5. User submits
6. Task appears in Task Manager for assigned user
7. Task appears (marked differently) for CC'd users
8. If patient linked → task appears in Patient Dashboard
9. Task description contains snippet from Document Assistant

**Outcome:** Actionable task created from protocol information

**Extraordinary permission:** Superadmin and Admin can perform this action even if not in trial_team.

---

### Flow 15: Export Response
**Actors:** Trial team member  
**Trigger:** Need response for external use (email, presentation, etc.)

**Happy Path:**
1. User receives response from query (Flow 10)
2. User clicks "Export"
3. Response downloads as PDF/document to user's device

**Outcome:** Response available for external use

**Extraordinary permission:** Superadmin and Admin can perform this action even if not in trial_team.

---

### Flow 16: View Saved Responses in Archive
**Actors:** Trial team member  
**Trigger:** Need to access previously saved information

**Happy Path:**
1. User navigates to Response Archive
2. User sees list of folders (e.g., "Visit 6 Specifications", "Side Effects - Nausea")
3. User clicks on folder
4. User sees all snippets saved in that folder
5. User clicks on snippet to view full content
6. User sees same action buttons: Send, Create Task, Export

**Outcome:** Access to organized saved information

**Extraordinary permission:** Superadmin and Admin can perform this action even if not in trial_team.

---

### Flow 17: Send or Create Task from Saved Snippet
**Actors:** Trial team member  
**Trigger:** Need to use previously saved information

**Happy Path:**
1. User navigates to Response Archive
2. User opens folder
3. User selects snippet
4. User clicks "Send" → follows Flow 13 (Send Response Directly)
5. OR user clicks "Create Task" → follows Flow 14 (Create Task from Response)

**Outcome:** Saved information reused for communication or task creation

**Extraordinary permission:** Superadmin and Admin can perform this action even if not in trial_team.

---

### Flow 18: Combine and Send Multiple Snippets
**Actors:** Trial team member  
**Trigger:** Need to send comprehensive information from multiple sources

**Happy Path:**
1. User navigates to Response Archive
2. User opens folder (e.g., "Visit 6 Specifications")
3. User selects multiple snippets using checkboxes
4. User clicks "Combine & Send"
5. Modal appears with:
   - Combined title (name for the combined message)
   - To field (select recipient)
   - CC field (select team members to inform)
   - Message field (add context)
6. User fills fields
7. User clicks "Send"
8. Combined message appears in Communication Hub
9. All selected snippets appear as single consolidated message

**Outcome:** Multiple pieces of information sent as cohesive message

**Extraordinary permission:** Superadmin and Admin can perform this action even if not in trial_team.

---

### Flow 37: Categorize Trial Documents
**Actors:** Trial team member  
**Trigger:** Uploading documents to trial

**Happy Path:**
1. User opens trial detail
2. User navigates to "Documents" section
3. User clicks "Upload"
4. User selects PDF file(s) from device
5. System prompts: "Document type?"
   - Protocol
   - Informed Consent Form (ICF)
   - Investigator's Brochure (IB)
   - Lab Manual
   - Case Report Form (CRF)
   - Study Procedures Manual
   - Regulatory Approval
   - Other (text field)
6. User selects type
7. User adds optional metadata:
   - Version number
   - Effective date
   - Description
8. System uploads and indexes for RAG
9. Document appears in trial's document list with type badge

**Outcome:** Documents organized by type, easier to search/reference

**Extraordinary permission:** Superadmin and Admin can perform this action even if not in trial_team.

---

### Flow 38: Upload Patient-Specific Documents
**Actors:** Trial team member  
**Trigger:** Need to attach documents to patient record

**Happy Path:**
1. User navigates to patient detail (Flow 8)
2. User goes to "Documents" tab
3. User clicks "Upload"
4. User selects file (PDF, image, etc.)
5. User categorizes:
   - Signed ICF
   - Medical History
   - Lab Results
   - Imaging
   - Other
6. User adds optional notes
7. Document attached to patient record
8. Document visible to all team members on this trial
9. Document appears in patient's timeline

**Outcome:** Patient has document repository within trial context

**Extraordinary permission:** Superadmin and Admin can perform this action even if not in trial_team.

---

### Flow 39: Upload Visit Documents
**Actors:** Trial team member  
**Trigger:** Completing visit, need to attach supporting documents

**Happy Path:**
1. User opens patient detail → specific visit
2. User navigates to visit activities
3. User clicks on activity (e.g., "Laboratory - CBC")
4. User clicks "Attach Document"
5. User uploads file (lab report PDF, scan, etc.)
6. Document linked to:
   - Patient
   - Visit
   - Specific activity
7. Document appears in visit detail
8. Document also appears in patient's overall document list

**Outcome:** Visit evidence documented, traceable to specific activity

**Note:** Visit documents are patient documents with additional context (visit + activity).

**Extraordinary permission:** Superadmin and Admin can perform this action even if not in trial_team.

---

## ÁREA 4: TASK MANAGER

### Flow 19: View Tasks
**Actors:** Trial team member  
**Trigger:** Need to see tasks

**Happy Path:**
1. User navigates to Task Manager
2. User sees Kanban board with columns: To Do, In Progress, Done
3. User can filter by:
   - Team members: All / Specific person / Myself
   - Trials: All trials / Specific trial
4. Board updates to show filtered tasks
5. Each task card shows:
   - Task type badge (LB, VS, PE, SA, AD)
   - Task title
   - Patient link (if applicable)
   - Visit context (if applicable)
   - Due date
   - Assigned person with role badge

**Outcome:** User sees relevant tasks

**Extraordinary permission:** Superadmin and Admin can perform this action even if not in trial_team.

---

### Flow 20: View Task Details
**Actors:** Trial team member  
**Trigger:** Need to understand task requirements

**Happy Path:**
1. User clicks on task card
2. Task detail view opens showing:
   - Task title
   - Description/content (from Document Assistant snippet if created from DA)
   - Assigned to (who executes)
   - Informed (CC'd users)
   - Due date
   - Task type (LB, VS, PE, SA, AD)
   - Linked patient (if applicable)
   - Status (To Do, In Progress, Done)
   - Creation date and creator

**Outcome:** User has complete task information

**Extraordinary permission:** Superadmin and Admin can perform this action even if not in trial_team.

---

### Flow 21: Create Task Manually
**Actors:** Trial team member  
**Trigger:** Need to create task not related to Document Assistant

**Happy Path:**
1. User navigates to Task Manager
2. User clicks "Create Task"
3. Modal appears with:
   - Task title
   - Description
   - Assign to (team member responsible)
   - CC/Inform (team members to notify)
   - Due date
   - Patient (optional - select from trial)
   - Task type: LB, VS, PE, SA, AD
4. User fills fields
5. User clicks "Create"
6. Task appears in Kanban board in "To Do" column

**Outcome:** New task created

**Extraordinary permission:** Superadmin and Admin can perform this action even if not in trial_team.

---

### Flow 22: Update Task Status
**Actors:** Assigned user or PI/CRC  
**Trigger:** Task progresses or completes

**Happy Path (Drag and Drop):**
1. User locates task in Kanban board
2. User drags task to new column (To Do → In Progress → Done)
3. Task status updates
4. If task linked to patient → Patient Dashboard updates automatically

**Happy Path (Detail View):**
1. User opens task detail
2. User changes status dropdown
3. User saves
4. Task moves to corresponding column
5. If task linked to patient → Patient Dashboard updates automatically

**Outcome:** Task status updated and reflected across system

**Note:** Assigned user can always update their own tasks. PI/CRC can update any task (supervisory role).

**Extraordinary permission:** Superadmin and Admin can perform this action even if not in trial_team.

---

### Flow 23: View Colleague's Tasks (Supervisor View)
**Actors:** Trial team member  
**Trigger:** Need to monitor team workload

**Happy Path:**
1. User navigates to Task Manager
2. User selects "All team members" filter
3. User sees all tasks across the team
4. User clicks on specific team member name to filter their tasks only
5. User can also navigate to Calendar view
6. User sees task distribution by date for selected team member(s)

**Outcome:** Supervisor has visibility into team workload

**Extraordinary permission:** Superadmin and Admin can perform this action even if not in trial_team.

---

### Flow 24: Reassign Task
**Actors:** PI, CRC, or original assignee  
**Trigger:** Team member unavailable or task needs different expertise

**Happy Path:**
1. User opens task detail
2. User changes "Assign to" field to different team member
3. User clicks "Save"
4. Task moves to new assignee's board
5. Original assignee no longer sees task (unless they are CC'd)
6. New assignee receives notification

**Outcome:** Task transferred to new responsible party

**Note:** Critical action - PI/CRC can reassign any task, original assignee can reassign their own.

**Extraordinary permission:** Superadmin and Admin can perform this action even if not in trial_team.

---

## ÁREA 5: COMMUNICATION HUB

### Flow 25: View Messages
**Actors:** Trial team member  
**Trigger:** Need to check communications

**Happy Path:**
1. User navigates to Communication Hub
2. User sees list of message threads
3. Messages where user is recipient (To) appear prominently
4. Messages where user is CC'd appear separately marked
5. Unread messages highlighted
6. Each thread shows:
   - Participants (sender + recipients)
   - Subject
   - Preview of last message
   - Trial context (if applicable)
   - Timestamp

**Outcome:** User sees all relevant communications

**Extraordinary permission:** Superadmin and Admin can perform this action even if not in trial_team.

---

### Flow 26: Read and Respond to Message
**Actors:** Message recipient  
**Trigger:** Need to read and reply to message

**Happy Path:**
1. User clicks on message thread
2. User sees:
   - Sender name and role
   - Original content (snippet from Document Assistant if sent from DA)
   - Any attached task (clickable link)
   - Full message thread history
3. User types reply in text field
4. User clicks "Send"
5. Reply appears in thread for all participants
6. All participants receive notification

**Outcome:** Message conversation continues

**Extraordinary permission:** Superadmin and Admin can perform this action even if not in trial_team.

---

### Flow 27: View Attached Task
**Actors:** Message recipient  
**Trigger:** Message references a task

**Happy Path:**
1. User opens message thread
2. User sees "Attached Task: [Task Name]" with link
3. User clicks task link
4. Task detail opens (same view as Task Manager)
5. User can view/edit task
6. User can navigate back to message thread

**Outcome:** User accesses task from message context

**Extraordinary permission:** Superadmin and Admin can perform this action even if not in trial_team.

---

### Flow 28: Start New Conversation
**Actors:** Trial team member  
**Trigger:** Need to communicate with colleague(s)

**Happy Path:**
1. User navigates to Communication Hub
2. User clicks "New Message"
3. Modal appears with:
   - To field (select recipient)
   - CC field (select team members to inform - optional)
   - Subject (message title)
   - Message (content)
   - Attach Task (optional - link existing task)
4. User fills fields
5. User clicks "Send"
6. New thread appears for all tagged users
7. All participants receive notification

**Outcome:** New conversation started

**Extraordinary permission:** Superadmin and Admin can perform this action even if not in trial_team.

---

## ÁREA 6: TRIAL MANAGEMENT

### Flow 29: Upload Documents to Trial
**Actors:** Trial team member  
**Trigger:** Need protocol documents available for querying

**Happy Path:**
1. User opens trial detail
2. User navigates to "Documents" section
3. User clicks "Upload"
4. User selects file(s) from device (PDF format)
5. System uploads and processes documents
6. System indexes documents for AI querying
7. Documents appear in trial's document list
8. Documents become available in Document Assistant dropdown for this trial

**Outcome:** Protocol documents available for AI-powered queries

**Note:** Combines with Flow 36 for document categorization.

**Extraordinary permission:** Superadmin and Admin can perform this action even if not in trial_team.

---

### Flow 30: Pause/Resume Trial
**Actors:** Superadmin or Admin  
**Trigger:** Trial needs to be temporarily suspended

**Happy Path (Pause):**
1. User opens trial detail
2. User clicks "Pause Trial"
3. Confirmation modal appears
4. User confirms
5. Trial status changes to `paused`
6. Trial marked as inactive
7. Trial remains in system but workflows stop

**Happy Path (Resume):**
1. User opens paused trial detail
2. User clicks "Resume Trial"
3. Trial status changes back to `active`
4. Workflows resume

**Outcome:** Trial status managed appropriately

**Note:** Organization scope action - affects trial entity itself.

---

## ÁREA 7: HOMEPAGE & CALENDAR

### Flow 31: First Login (Empty State)
**Actors:** New organization owner  
**Trigger:** First login after accepting invitation

**Happy Path:**
1. New owner logs in after completing signup (Flow 2)
2. Owner lands on Homepage
3. Homepage displays empty state with guided setup:
   - **Step 1:** Invite team members (links to Flow 3)
   - **Step 2:** Create your first trial (links to Flow 4)
4. Owner clicks "Invite Members"
5. Owner adds team members with roles
6. Owner clicks "Create Trial"
7. Owner enters trial details
8. Homepage now shows trial card and metrics

**Outcome:** Organization set up and ready for use

---

### Flow 32: Returning User Homepage
**Actors:** Organization member  
**Trigger:** Regular login

**Happy Path:**
1. User logs in
2. User lands on Homepage
3. Homepage displays:
   - Active trials count
   - Total patients count
   - Team members count
   - Quick action buttons (Go to Document Assistant, Create Task, Sign New Patient)
   - Today's tasks section with upcoming items
   - Calendar preview showing this week
4. User clicks on trial card to enter trial workspace
5. User redirects to trial detail view

**Outcome:** User has overview of organization status

---

### Flow 33: View Team Calendar
**Actors:** Organization member  
**Trigger:** Need to see team schedule and workload

**Happy Path:**
1. User navigates to Calendar (from Homepage or navigation menu)
2. User sees calendar view with all tasks displayed as events
3. **Visibility:**
   - Superadmin/Admin: See tasks from ALL trials
   - Editor/Reader: See tasks only from assigned trials
4. User can filter by:
   - All team members
   - Specific person
   - Myself
5. User can switch view: Day / Week / Month
6. User clicks on task in calendar
7. Task detail opens (same as Task Manager view)
8. Tasks show:
   - Task type badge
   - Patient link (if applicable)
   - Visit context (if applicable)
   - Assigned person

**Outcome:** User has visual overview of team schedule

**Note:** Calendar is an organization-scope tool with trial-filtered visibility based on role.

---

## ÁREA 8: SYSTEM & AUDIT

### Flow 40: System Logs All Actions
**Actors:** System (automatic)  
**Trigger:** Any action performed in the system

**Happy Path:**
1. User performs action (create, edit, delete, view, etc.)
2. System automatically captures:
   - Action type (e.g., "create_patient", "delete_document", "reassign_task")
   - User who performed action (user_id, email, role)
   - Timestamp (ISO 8601 format)
   - Organization context (org_id)
   - Trial context (trial_id, if applicable)
   - Resource affected (patient_id, task_id, document_id, etc.)
   - Before/after state (for modifications)
   - IP address
   - User agent
3. System writes log entry to audit_logs table
4. Log is immutable (cannot be modified or deleted by users)
5. Logs accessible to superadmin for compliance/audit purposes

**Outcome:** Complete audit trail maintained for all system actions

**Note:** This is a system-level flow that runs automatically for every user action. Essential for compliance, security, and debugging.

---

## FLOW SUMMARY

**Total Flows:** 40

**By Area:**
1. Setup & Admin (6 flows): Organization creation, ownership, support access
2. Patient Management & Visits (6 flows): Create patient, view dashboard, task from patient, configure visit schedules, configure task assignments
3. Document Assistant + Archive (12 flows): Query, save, organize, share information, categorize documents
4. Task Manager (6 flows): View, create, update, reassign tasks
5. Communication Hub (4 flows): View, respond, attach tasks
6. Trial Management (2 flows): Upload docs, pause/resume
7. Homepage & Calendar (3 flows): First login, dashboard, calendar
8. System & Audit (1 flow): Automatic action logging

---

## TECHNICAL NOTES

### Authentication Flow
1. **Clinic users - First login:** Magic link → profile completion → password setup
2. **Clinic users - Subsequent logins:** Email + password at `/signin`
3. **Staff access:** Separate route `/console/signin` for Themison staff (@themison.com)
4. **Staff role:** Stored in `supabase.auth.users` with `role = 'staff'`
5. **Support access:** Staff act as superadmin when `support_enabled = true`

### Multi-tenancy
- Organizations are isolated
- Clinic users can belong to multiple organizations
- Staff members do NOT belong to any organization (access via support mode)
- Trial access controlled by trial team assignments
- Patients scoped to trials, not organizations

### Scopes
- **Organization scope:** Create/delete/pause trials, invite members, manage settings
- **Trial scope:** Everything within trial (patients, tasks, documents, messages, visits)
- **Extraordinary permission:** Superadmin and Admin have automatic access to all trials

### Data Visibility
- **Superadmin/Admin:** See all trials, all data
- **Editor/Reader:** Only see assigned trials
- Within trial, all assigned members see all tasks and data
- Calendar shows tasks based on trial access (all for superadmin/admin, filtered for others)
- Communication Hub shows only messages where user is participant

### Permissions
- **Superadmin:** Full access, can delete org/users, automatic access to all trials
- **Admin:** Same as superadmin EXCEPT cannot delete org/users
- **Editor:** Can work within assigned trials, no management permissions
- **Reader:** View only in assigned trials
- **PI/CRC:** Elevated permissions for critical actions within trials (assign people, delete items, reassign tasks, configure schedules)

### Audit Logging
- All actions logged automatically
- Logs are immutable
- Accessible to superadmin for compliance
- Includes user, timestamp, action, context, before/after state

### Soft Deletes
- All deletions use soft delete with `deleted_at` timestamp
- Applies to: patients, documents, tasks, trials, organization members
- Maintains complete audit trail for compliance
- Deleted items not visible in UI but preserved in database
- Can be restored if needed (superadmin only)
- Hard delete never used (regulatory compliance requirement)

### Document Versioning
- Multiple versions of documents can be uploaded
- Each version has: version_number, uploaded_at, uploaded_by
- Newest version is default/active
- Previous versions accessible in document history
- Version number auto-increments on upload

### Task Auto-generation
- Tasks automatically created when patient enrolled (if visit schedule template exists)
- Tasks auto-assigned based on task assignment rules (Flow 35)
- One task per visit activity (LB, VS, PE, SA, AD)
- Tasks linked to: patient, visit, activity
- Assignment can be changed manually after creation

---

## DECISIONS MADE

All design decisions have been finalized:

1. **Visit Schedule Creation:** ✅ Manual template configuration (Flow 34) + RAG extraction future feature (Flow 36)
2. **Visit Schedule Modification:** ✅ Does NOT affect existing patients (simple MVP approach)
3. **Task Assignment:** ✅ Assignment rules configured per trial (Flow 35) - maps activity types to default assignees
4. **Task Auto-generation:** ✅ Tasks automatically created when patient enrolled, auto-assigned per rules (Flow 35)
5. **Response Archive Folders:** ✅ Personal only (each user has their own)
6. **Document Types:** ✅ Categorized on upload (Protocol, ICF, Lab Manual, etc.)
7. **Patient Documents:** ✅ Same table as visit documents with optional visit/activity link
8. **Visit Documents:** ✅ Patient documents with visit + activity context
9. **Document Versioning:** ✅ Multiple versions stored, newest is default/active
10. **Scopes:** ✅ Organization scope vs Trial scope clearly defined
11. **Permissions:** ✅ Standard (trial team) vs Critical (PI/CRC) vs Extraordinary (superadmin/admin)
12. **Calendar:** ✅ Organization-scope tool with visibility filtered by role
13. **Audit Logging:** ✅ All actions logged automatically for compliance
14. **Soft Deletes:** ✅ All deletions use soft delete with deleted_at timestamp for compliance
15. **Visit Activities:** ✅ Fixed types system-wide (LB, VS, PE, SA, AD) - not customizable per organization

---

**END OF DOCUMENT**
