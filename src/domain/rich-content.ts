import { z } from "zod";

/**
 * Bounded rich content: text, optional image, optional audio.
 * Never contains arbitrary HTML.
 * @see agent-work/shared/CONTRACTS.md §4
 */
export const imageFitSchema = z.enum(["contain", "cover"]);

export const focalPointSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

export const richContentSchema = z
  .object({
    text: z.string().max(2000).optional(),
    imageAssetId: z.string().uuid().optional(),
    imageAlt: z.string().max(500).optional(),
    imageFit: imageFitSchema.optional(),
    focalPoint: focalPointSchema.optional(),
    audioAssetId: z.string().uuid().optional(),
    audioLabel: z.string().max(500).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.imageAssetId && !value.imageAlt?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "imageAlt is required when imageAssetId is present",
        path: ["imageAlt"],
      });
    }
    if (value.audioAssetId && !value.audioLabel?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "audioLabel (or transcript) is required when audioAssetId is present",
        path: ["audioLabel"],
      });
    }
  });

export type RichContent = z.infer<typeof richContentSchema>;
export type ImageFit = z.infer<typeof imageFitSchema>;
export type FocalPoint = z.infer<typeof focalPointSchema>;

/** True when at least one meaningful content channel is present. */
export function hasMeaningfulContent(content: RichContent): boolean {
  return Boolean(
    content.text?.trim() ||
      content.imageAssetId ||
      content.audioAssetId,
  );
}
