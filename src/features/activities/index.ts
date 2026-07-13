/**
 * Activities feature — Workstream 01 (foundation/data).
 * Dashboard, persistence, versions, public resolve.
 */
export const ACTIVITIES_FEATURE = "activities" as const;

export {
  ActivityService,
  createActivityService,
} from "@/features/activities/activity-service";
export {
  createMemoryActivityService,
  getRequestActivityRepository,
  getRequestActivityService,
} from "@/features/activities/repository";
export {
  emptyContentForTemplate,
  contentFamilyForTemplate,
} from "@/features/activities/empty-content";
export {
  createActivityAction,
  createActivityJsonAction,
  listActivitiesAction,
  getActivityAction,
  autosaveActivityAction,
  finalizeActivityAction,
  softDeleteActivityAction,
  softDeleteActivityFormAction,
  restoreActivityAction,
  duplicateActivityAction,
  renameActivityAction,
  publishActivityAction,
  disablePublicActivityAction,
  regenerateSlugAction,
  resolvePublicSnapshotAction,
  type ActionResult,
} from "@/features/activities/actions";
