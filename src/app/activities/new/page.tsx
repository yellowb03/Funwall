import { getProductRegistry } from "@/features/templates/registry";
import { TemplatePicker } from "@/features/editor/picker/TemplatePicker";

export default function NewActivityPage() {
  const registry = getProductRegistry();
  const registeredKeys = registry.keys();

  return <TemplatePicker registeredKeys={registeredKeys} />;
}
