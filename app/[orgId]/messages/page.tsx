import { MessagesInbox } from "@/components/app/messages/MessagesInbox";

interface MessagesPageProps {
  params: Promise<{
    orgId: string;
  }>;
}

export default async function MessagesPage({ params }: MessagesPageProps) {
  const { orgId } = await params;

  return (
    <div className="h-full flex flex-col w-full">
      {/* Navigation Bar */}
      <div className="bg-white rounded-lg border border-gray-200 px-2 py-1.5 mb-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-gray-100 rounded-md">
            <span>Communication Hub</span>
          </div>
        </div>
      </div>

      {/* Messages Inbox */}
      <MessagesInbox orgId={orgId} />
    </div>
  );
}
