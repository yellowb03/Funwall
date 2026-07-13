import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/design-system/Button";

describe("Button", () => {
  it("renders children and primary variant by default", () => {
    render(<Button>Done</Button>);
    const button = screen.getByRole("button", { name: "Done" });
    expect(button).toBeInTheDocument();
    expect(button.className).toContain("bg-[var(--fw-color-primary)]");
  });
});
