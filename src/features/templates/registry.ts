import type { TemplateKey } from "@/domain/template-keys";
import { TEMPLATE_KEYS } from "@/domain/template-keys";
import type { AnyTemplateRegistration } from "@/domain/template-registration";
import { createWheelRegistration } from "@/features/templates/wheel/registration";

/**
 * Central template registry.
 * Only the integration lead merges changes here.
 * Activity agents export registration factories from their folders.
 *
 * @see agent-work/shared/CONTRACTS.md §5
 * @see docs/adr/ADR-003-template-registration.md
 */

export class TemplateRegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TemplateRegistryError";
  }
}

export class TemplateRegistry {
  private readonly byKey = new Map<TemplateKey, AnyTemplateRegistration>();

  register(registration: AnyTemplateRegistration): void {
    const key = registration.metadata.key;

    if (!(TEMPLATE_KEYS as readonly string[]).includes(key)) {
      throw new TemplateRegistryError(
        `Refusing to register unknown template key "${key}". Launch allows exactly: ${TEMPLATE_KEYS.join(", ")}`,
      );
    }

    if (this.byKey.has(key)) {
      throw new TemplateRegistryError(
        `Template key "${key}" is already registered`,
      );
    }

    if (this.byKey.size >= TEMPLATE_KEYS.length) {
      throw new TemplateRegistryError(
        `Registry already has ${TEMPLATE_KEYS.length} templates; cannot register more`,
      );
    }

    if (
      registration.capabilities.hasLeaderboard &&
      !registration.capabilities.isScored
    ) {
      throw new TemplateRegistryError(
        `Template "${key}" cannot have a leaderboard when isScored is false`,
      );
    }

    if (
      registration.capabilities.isScored &&
      !registration.loadResultReviewAdapter
    ) {
      // Soft requirement for stubs: scored games should provide review later.
      // Enforced strictly once Milestone 2+ templates land; Wheel is unscored.
    }

    this.byKey.set(key, registration);
  }

  get(key: TemplateKey): AnyTemplateRegistration {
    const reg = this.byKey.get(key);
    if (!reg) {
      throw new TemplateRegistryError(`Template "${key}" is not registered`);
    }
    return reg;
  }

  has(key: TemplateKey): boolean {
    return this.byKey.has(key);
  }

  list(): AnyTemplateRegistration[] {
    return TEMPLATE_KEYS.filter((k) => this.byKey.has(k)).map(
      (k) => this.byKey.get(k)!,
    );
  }

  keys(): TemplateKey[] {
    return TEMPLATE_KEYS.filter((k) => this.byKey.has(k));
  }

  size(): number {
    return this.byKey.size;
  }

  /** Lazy-load the player adapter module for a registered template. */
  async loadPlayerAdapter(key: TemplateKey) {
    const reg = this.get(key);
    return reg.loadPlayerAdapter();
  }

  /** Lazy-load the editor adapter module for a registered template. */
  async loadEditorAdapter(key: TemplateKey) {
    const reg = this.get(key);
    return reg.loadEditorAdapter();
  }
}

/** Product registry singleton used by route assembly. */
let productRegistry: TemplateRegistry | null = null;

/**
 * Build the product registry with currently available registrations.
 * Phase 1 registers Wheel stub only; other templates register as their agents land.
 */
export function createProductRegistry(): TemplateRegistry {
  const registry = new TemplateRegistry();
  registry.register(createWheelRegistration());
  return registry;
}

export function getProductRegistry(): TemplateRegistry {
  if (!productRegistry) {
    productRegistry = createProductRegistry();
  }
  return productRegistry;
}

/** Test helper to reset the singleton between suites. */
export function resetProductRegistryForTests(): void {
  productRegistry = null;
}
