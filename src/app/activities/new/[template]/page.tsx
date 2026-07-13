import { notFound } from "next/navigation";
import { isTemplateKey, type TemplateKey } from "@/domain/template-keys";
import type { ContentPackV1 } from "@/domain/content";
import type { EditorAdapter } from "@/features/editor/types";
import { emptyContentForTemplate } from "@/features/editor/empty-drafts";
import { getDefaultEditorPort } from "@/features/editor/persistence/memory-port";
import { EditorWorkspace } from "@/features/editor/EditorWorkspace";
import { getProductRegistry } from "@/features/templates/registry";

interface PageProps {
  params: Promise<{ template: string }>;
}

/**
 * Creates a draft activity for the selected template and opens the shared editor.
 */
export default async function NewTemplateEditorPage({ params }: PageProps) {
  const { template } = await params;
  if (!isTemplateKey(template)) {
    notFound();
  }

  const templateKey = template as TemplateKey;
  const port = getDefaultEditorPort();
  const activity = await port.createDraft({
    templateKey,
    content: emptyContentForTemplate(templateKey),
    settings: {},
    themeKey: "default",
  });

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
