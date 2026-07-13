import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TemplatePicker } from "@/features/editor/picker/TemplatePicker";
import { TEMPLATE_CATALOG } from "@/features/editor/template-catalog";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("TemplatePicker", () => {
  beforeEach(() => {
    push.mockReset();
  });

  it("renders six template cards", () => {
    render(<TemplatePicker registeredKeys={["wheel"]} />);
    expect(screen.getByTestId("template-grid").querySelectorAll("li")).toHaveLength(
      6,
    );
    expect(
      screen.getByRole("button", { name: /Select Spin the wheel/i }),
    ).toBeInTheDocument();
  });

  it("filters cards by search", async () => {
    const user = userEvent.setup();
    render(<TemplatePicker />);
    await user.type(screen.getByPlaceholderText("Search templates"), "quiz");
    const cards = screen.getByTestId("template-grid").querySelectorAll("li");
    expect(cards.length).toBe(2);
    expect(
      screen.getByRole("button", { name: "Select Gameshow quiz" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Select Image quiz" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Select Spin the wheel" }),
    ).toBeNull();
  });

  it("toggles alphabetical sort", async () => {
    const user = userEvent.setup();
    render(<TemplatePicker entries={[...TEMPLATE_CATALOG]} />);
    await user.click(screen.getByRole("button", { name: "Alphabetical" }));
    const titles = [
      ...screen.getByTestId("template-grid").querySelectorAll("h2"),
    ].map((el) => el.textContent);
    const sorted = [...titles].sort((a, b) =>
      (a ?? "").localeCompare(b ?? "", "en", { sensitivity: "base" }),
    );
    expect(titles).toEqual(sorted);
  });

  it("navigates on Enter key", async () => {
    const user = userEvent.setup();
    render(<TemplatePicker />);
    const card = screen.getByRole("button", { name: "Select Spin the wheel" });
    card.focus();
    await user.keyboard("{Enter}");
    expect(push).toHaveBeenCalledWith("/activities/new/wheel");
  });

  it("navigates on click", async () => {
    const user = userEvent.setup();
    render(<TemplatePicker />);
    await user.click(
      screen.getByRole("button", { name: "Select Matching pairs" }),
    );
    expect(push).toHaveBeenCalledWith("/activities/new/matching-pairs");
  });
});
