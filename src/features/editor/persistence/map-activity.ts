import type { ContentPackV1 } from "@/domain/content";
import type { ActivityRecord } from "@/services/db/types";
import type { EditorActivity } from "@/features/editor/persistence/types";

/**
 * Maps foundation ActivityRecord → editor-facing projection.
 */
export function activityRecordToEditor(activity: ActivityRecord): EditorActivity {
  return {
    id: activity.id,
    publicSlug: activity.publicSlug,
    title: activity.title,
    instruction: activity.instruction ?? undefined,
    templateKey: activity.templateKey,
    content: activity.content as ContentPackV1,
    settings: activity.settings,
    themeKey: activity.themeKey,
    revision: activity.revision,
    status:
      activity.lifecycleState === "published" ||
      activity.lifecycleState === "archived"
        ? "finalized"
        : "draft",
    createdAt: activity.createdAt,
    updatedAt: activity.updatedAt,
  };
}
