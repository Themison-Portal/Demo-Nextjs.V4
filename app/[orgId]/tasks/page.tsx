import { TasksView } from "@/components/app/tasks/TasksView";

interface TasksPageProps {
  params: Promise<{
    orgId: string;
  }>;
}

export default async function TasksPage({ params }: TasksPageProps) {
  const { orgId } = await params;

  return <TasksView orgId={orgId} />;
}
