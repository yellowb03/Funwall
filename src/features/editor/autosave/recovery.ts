import type { ContentPackV1 } from "@/domain/content";
import type { TemplateKey } from "@/domain/template-keys";

/**
 * Local recovery draft until the server acknowledges the latest dirty revision.
 * @see docs/adr/ADR-004-autosave-revision.md
 */

export interface RecoveryDraft {
  activityId: string;
  templateKey: TemplateKey;
  title: string;
  instruction?: string;
  content: ContentPackV1;
  settings: Record<string, unknown>;
  themeKey: string;
  /** Local dirty sequence when written. */
  dirtySeq: number;
  /** Last known server revision when written. */
  baseRevision: number;
  savedAt: string;
}

const PREFIX = "funwall:recovery:";

export function recoveryStorageKey(activityId: string): string {
  return `${PREFIX}${activityId}`;
}

export function writeRecoveryDraft(
  draft: RecoveryDraft,
  storage: Pick<Storage, "setItem"> = globalThis.localStorage,
): void {
  try {
    storage.setItem(recoveryStorageKey(draft.activityId), JSON.stringify(draft));
  } catch {
    // Quota / private mode — best effort only.
  }
}

export function readRecoveryDraft(
  activityId: string,
  storage: Pick<Storage, "getItem"> = globalThis.localStorage,
): RecoveryDraft | null {
  try {
    const raw = storage.getItem(recoveryStorageKey(activityId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RecoveryDraft;
    if (
      !parsed ||
      parsed.activityId !== activityId ||
      typeof parsed.baseRevision !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearRecoveryDraft(
  activityId: string,
  storage: Pick<Storage, "removeItem"> = globalThis.localStorage,
): void {
  try {
    storage.removeItem(recoveryStorageKey(activityId));
  } catch {
    // ignore
  }
}

/**
 * Offer recovery when local draft is newer than server ack or server load fails.
 */
export function shouldOfferRecovery(
  recovery: RecoveryDraft | null,
  serverRevision: number,
): recovery is RecoveryDraft {
  if (!recovery) return false;
  return recovery.dirtySeq > 0 || recovery.baseRevision >= serverRevision;
}
