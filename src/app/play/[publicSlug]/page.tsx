import { notFound } from "next/navigation";
import { publicActivitySnapshotSchema } from "@/domain/snapshot";
import { createMemoryPublicPlayPort } from "@/features/player/session/memory-public-play-port";
import { buildWheelSnapshot } from "@/features/player/fixtures";
import { PublicPlayClient } from "@/app/play/[publicSlug]/PublicPlayClient";

/**
 * Demo / local-dev snapshots until activities persistence (WS01) is live.
 * Only known fixture slugs resolve; everything else is generic not-found.
 */
function getDevPort() {
  const wheel = buildWheelSnapshot();
  return createMemoryPublicPlayPort({
    snapshots: {
      [wheel.publicSlug]: wheel,
      // Alias used in docs/manual checks
      "demo-wheel": buildWheelSnapshot({ publicSlug: "demo-wheel" }),
    },
  });
}

export default async function PublicPlayPage({
  params,
}: {
  params: Promise<{ publicSlug: string }>;
}) {
  const { publicSlug } = await params;
  const port = getDevPort();
  const raw = await port.resolveSnapshot(publicSlug);

  if (!raw) {
    // Generic not-found — do not leak whether the slug ever existed.
    notFound();
  }

  const snapshot = publicActivitySnapshotSchema.parse(raw);

  return <PublicPlayClient snapshot={snapshot} />;
}
