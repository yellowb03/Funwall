import { redirect } from "next/navigation";
import { getProductRegistry } from "@/features/templates/registry";
import { TemplatePicker } from "@/features/editor/picker/TemplatePicker";
import { getOwnerSession } from "@/features/auth/session";

export default async function NewActivityPage() {
  const session = await getOwnerSession();
  if (!session) {
    redirect("/login?next=/activities/new");
  }

  const registry = getProductRegistry();
  const registeredKeys = registry.keys();

  return <TemplatePicker registeredKeys={registeredKeys} />;
}
