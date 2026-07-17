import { notFound, redirect } from "next/navigation";
import { isTemplateKey, type TemplateKey } from "@/domain/template-keys";
import { getProductRegistry } from "@/features/templates/registry";
import { getOwnerSession } from "@/features/auth/session";
import { CreateDraftClient } from "@/features/activities/components/CreateDraftClient";

interface PageProps {
  params: Promise<{ template: string }>;
}

/**
 * Validates template + session, then creates a draft via client-triggered
 * server action (cookie writes require an action context on Vercel).
 */
export default async function NewTemplateEditorPage({ params }: PageProps) {
  const session = await getOwnerSession();
  const { template } = await params;

  if (!session) {
    redirect(
      `/login?next=${encodeURIComponent(`/activities/new/${template}`)}`,
    );
  }

  if (!isTemplateKey(template)) {
    notFound();
  }

  const templateKey = template as TemplateKey;
  const registry = getProductRegistry();
  if (!registry.has(templateKey)) {
    notFound();
  }

  return <CreateDraftClient templateKey={templateKey} />;
}
