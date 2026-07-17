import { notFound, redirect } from "next/navigation";
import { activityRecordToEditor } from "@/features/editor/persistence/map-activity";
import { EditorWorkspace } from "@/features/editor/EditorWorkspace";
import { getOwnerSession } from "@/features/auth/session";
import { getRequestActivityService } from "@/features/activities/repository";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Re-open an existing activity in the shared content editor.
 */
export default async function EditActivityPage({ params }: PageProps) {
  const session = await getOwnerSession();
  const { id } = await params;

  if (!session) {
    redirect(`/login?next=${encodeURIComponent(`/activities/${id}/edit`)}`);
  }

  const service = await getRequestActivityService();
  const detail = await service.getOwnerActivity(session.ownerId, id);
  if (!detail) {
    notFound();
  }

  const activity = activityRecordToEditor(detail.activity);
  const templateKey = activity.templateKey;

  return (
    <main className="flex flex-1 flex-col">
      <EditorWorkspace
        activity={activity}
        templateKey={templateKey}
      />
    </main>
  );
}
