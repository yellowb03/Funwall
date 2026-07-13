import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RichContentField } from "@/features/editor/RichContentField";
import type { RichContent } from "@/domain/rich-content";

function StatefulField({
  initial = { text: "" },
  onOpenMedia,
}: {
  initial?: RichContent;
  onOpenMedia?: () => void;
}) {
  const [value, setValue] = useState<RichContent>(initial);
  return (
    <RichContentField
      value={value}
      onChange={setValue}
      label="Item"
      onOpenMedia={onOpenMedia}
    />
  );
}

describe("RichContentField", () => {
  it("updates plain text without HTML", async () => {
    const user = userEvent.setup();
    render(<StatefulField />);

    await user.type(screen.getByLabelText("Item"), "Hello");
    expect(screen.getByLabelText("Item")).toHaveValue("Hello");
  });

  it("shows image controls and alt/fit when image present", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const assetId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

    render(
      <RichContentField
        value={{
          text: "Apple",
          imageAssetId: assetId,
          imageAlt: "A red apple",
          imageFit: "contain",
        }}
        onChange={onChange}
        label="Item"
        resolveAsset={() => ({
          id: assetId,
          ownerId: null,
          provider: "fixture",
          providerAssetId: "x",
          url: "data:image/svg+xml,test",
          thumbnailUrl: "data:image/svg+xml,test",
          width: 10,
          height: 10,
          mimeType: "image/svg+xml",
          title: "Apple",
          defaultAlt: "A red apple",
          creatorName: null,
          creatorUrl: null,
          sourcePageUrl: null,
          license: "CC0",
          licenseUrl: null,
          attributionText: "Apple",
          createdAt: new Date().toISOString(),
          softDeleted: false,
        })}
        onOpenMedia={vi.fn()}
      />,
    );

    expect(screen.getByText("Replace image")).toBeInTheDocument();
    expect(screen.getByText("Remove image")).toBeInTheDocument();
    expect(screen.getByLabelText("Alt text")).toHaveValue("A red apple");

    await user.click(screen.getByRole("button", { name: "cover" }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ imageFit: "cover" }),
    );

    await user.click(screen.getByRole("button", { name: "Remove image" }));
    const removed = onChange.mock.calls.at(-1)?.[0] as RichContent;
    expect(removed.imageAssetId).toBeUndefined();
    expect(removed.text).toBe("Apple");
  });

  it("calls onOpenMedia for Add image", async () => {
    const user = userEvent.setup();
    const onOpenMedia = vi.fn();
    render(<StatefulField onOpenMedia={onOpenMedia} />);
    await user.click(screen.getByRole("button", { name: "Add image" }));
    expect(onOpenMedia).toHaveBeenCalled();
  });
});
