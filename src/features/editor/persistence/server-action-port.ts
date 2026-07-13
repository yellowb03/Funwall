"use client";

import type { ContentPackV1 } from "@/domain/content";
import {
  autosaveActivityAction,
  finalizeActivityAction,
  getActivityAction,
} from "@/features/activities/actions";
import { activityRecordToEditor } from "@/features/editor/persistence/map-activity";
import type { EditorActivityPort } from "@/features/editor/persistence/port";
import type {
  AutosavePatch,
  AutosaveSuccess,
  CreateDraftInput,
  EditorActivity,
  FinalizeSuccess,
} from "@/features/editor/persistence/types";
import {
  EditorConflictError,
  EditorNotFoundError,
  EditorPersistenceError,
  EditorValidationError,
} from "@/features/editor/persistence/types";

/**
 * Editor port backed by Workstream 01 server actions + durable repository.
 * Create-draft stays on the server page (auth + ActivityService); this port
 * handles get / autosave / finalize for the client workspace.
 */
export function createServerActionEditorPort(): EditorActivityPort {
  return {
    async createDraft(_input: CreateDraftInput): Promise<EditorActivity> {
      throw new EditorPersistenceError(
        "createDraft is handled by the server editor page via ActivityService",
      );
    },

    async get(id: string): Promise<EditorActivity> {
      const result = await getActivityAction(id);
      if (!result.ok) {
        if (result.code === "NOT_FOUND") {
          throw new EditorNotFoundError(id);
        }
        throw new EditorPersistenceError(result.message);
      }
      return activityRecordToEditor(result.data.activity);
    },

    async autosave(
      id: string,
      baseRevision: number,
      patch: AutosavePatch,
    ): Promise<AutosaveSuccess> {
      const result = await autosaveActivityAction({
        activityId: id,
        baseRevision,
        title: patch.title,
        instruction: patch.instruction,
        content: patch.content,
        settings: patch.settings,
        themeKey: patch.themeKey,
      });
      if (!result.ok) {
        if (result.code === "CONFLICT") {
          const latest = await getActivityAction(id);
          if (latest.ok) {
            throw new EditorConflictError(
              activityRecordToEditor(latest.data.activity),
            );
          }
        }
        throw new EditorPersistenceError(result.message);
      }
      return {
        revision: result.data.revision,
        updatedAt: result.data.updatedAt,
      };
    },

    async finalize(
      id: string,
      baseRevision: number,
    ): Promise<FinalizeSuccess> {
      const current = await getActivityAction(id);
      if (!current.ok) {
        if (current.code === "NOT_FOUND") {
          throw new EditorNotFoundError(id);
        }
        throw new EditorPersistenceError(current.message);
      }

      const result = await finalizeActivityAction({
        activityId: id,
        baseRevision,
        publish: true,
        title: current.data.activity.title,
        instruction: current.data.activity.instruction,
        content: current.data.activity.content as ContentPackV1,
        settings: current.data.activity.settings,
        themeKey: current.data.activity.themeKey,
      });

      if (!result.ok) {
        if (result.code === "CONFLICT") {
          const latest = await getActivityAction(id);
          if (latest.ok) {
            throw new EditorConflictError(
              activityRecordToEditor(latest.data.activity),
            );
          }
        }
        if (result.code === "VALIDATION") {
          throw new EditorValidationError(result.message, [
            { path: [], message: result.message },
          ]);
        }
        throw new EditorPersistenceError(result.message);
      }

      if (!result.data.publicSlug) {
        throw new EditorPersistenceError(
          "Finalize succeeded but no public slug was assigned",
        );
      }

      return {
        id: result.data.id,
        publicSlug: result.data.publicSlug,
        revision: result.data.revision,
        updatedAt: result.data.updatedAt,
      };
    },
  };
}
