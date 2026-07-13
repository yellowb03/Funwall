import { redirect } from "next/navigation";
import { getOwnerSession } from "@/features/auth/session";
import { getRequestActivityService } from "@/features/activities/repository";
import { ActivitiesDashboard } from "@/features/activities/components/ActivitiesDashboard";

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getOwnerSession();
  if (!session) {
    redirect("/login?next=/activities");
  }

  const params = await searchParams;
  const search = params.q?.trim() ?? "";

  let errorMessage: string | null = null;
  let activities = [] as Awaited<
    ReturnType<
      Awaited<ReturnType<typeof getRequestActivityService>>["listOwnerActivities"]
    >
  >;

  try {
    const service = await getRequestActivityService();
    activities = await service.listOwnerActivities(session.ownerId, {
      search: search || undefined,
      sortBy: "updatedAt",
      sortDir: "desc",
    });
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Failed to load activities";
  }

  return (
    <ActivitiesDashboard
      session={session}
      activities={activities}
      search={search}
      errorMessage={errorMessage}
    />
  );
}
