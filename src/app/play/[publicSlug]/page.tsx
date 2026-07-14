import { notFound } from "next/navigation";
import { publicActivitySnapshotSchema } from "@/domain/snapshot";
import { resolvePublicSnapshotAction } from "@/features/activities/actions";
import { createMemoryPublicPlayPort } from "@/features/player/session/memory-public-play-port";
import {
  buildImageQuizSnapshot,
  buildWheelSnapshot,
} from "@/features/player/fixtures";
import { PublicPlayClient } from "@/app/play/[publicSlug]/PublicPlayClient";

/**
 * Fixture fallbacks for local demo when no published activity matches the slug.
 */
function getDevPort() {
  const wheel = buildWheelSnapshot();
  const imageQuiz = buildImageQuizSnapshot();
  return createMemoryPublicPlayPort({
    snapshots: {
      [wheel.publicSlug]: wheel,
      "demo-wheel": buildWheelSnapshot({ publicSlug: "demo-wheel" }),
      [imageQuiz.publicSlug]: imageQuiz,
      "demo-image-quiz": buildImageQuizSnapshot({
        publicSlug: "demo-image-quiz",
      }),
    },
  });
}

export default async function PublicPlayPage({
  params,
}: {
  params: Promise<{ publicSlug: string }>;
}) {
  const { publicSlug } = await params;

  let raw = await resolvePublicSnapshotAction(publicSlug);
  if (!raw) {
    raw = await getDevPort().resolveSnapshot(publicSlug);
  }

  if (!raw) {
    // Generic not-found — do not leak whether the slug ever existed.
    notFound();
  }

  const snapshot = publicActivitySnapshotSchema.parse(raw);

  return <PublicPlayClient snapshot={snapshot} />;
}
