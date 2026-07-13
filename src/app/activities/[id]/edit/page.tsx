import { notFound, redirect } from "next/navigation";
import type { ContentPackV1 } from "@/domain/content";
import type { TemplateKey } from "@/domain/template-keys";
import type { EditorAdapter } from "@/features/editor/types";
import { activityRecordToEditor } from "@/features/editor/persistence/map-activity";
import { EditorWorkspace } from "@/features/editor/EditorWorkspace";
import { getProductRegistry } from "@/features/templates/registry";
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
  const adapter = await loadAdapter(templateKey);

  return (
    <main className="flex flex-1 flex-col">
      <EditorWorkspace
        activity={activity}
        templateKey={templateKey}
        adapter={adapter}
      />
    </main>
  );
}

async function loadAdapter(
  templateKey: TemplateKey,
): Promise<EditorAdapter<ContentPackV1> | null> {
  const registry = getProductRegistry();
  if (!registry.has(templateKey)) {
    return null;
  }

  try {
    const mod = await registry.loadEditorAdapter(templateKey);
    if (
      mod &&
      typeof mod === "object" &&
      "createEditorAdapter" in mod &&
      typeof mod.createEditorAdapter === "function"
    ) {
      return mod.createEditorAdapter() as EditorAdapter<ContentPackV1>;
    }
  } catch {
    return null;
  }
  return null;
}
