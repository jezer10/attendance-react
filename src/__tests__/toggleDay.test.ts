import { describe, expect, it } from "vitest";
import { toggleDay } from "../features/automation/components/useAutomationForm";

describe("toggleDay", () => {
  it("adds a missing day in canonical order", () => {
    expect(toggleDay(["Lun", "Mie", "Vie"], "Mar")).toEqual(["Lun", "Mar", "Mie", "Vie"]);
  });

  it("removes a present day", () => {
    expect(toggleDay(["Lun", "Mar", "Mie"], "Mar")).toEqual(["Lun", "Mie"]);
  });

  it("handles empty input", () => {
    expect(toggleDay([], "Dom")).toEqual(["Dom"]);
  });

  it("preserves the order when adding to the end of the canonical list", () => {
    expect(toggleDay(["Lun", "Mar"], "Sab")).toEqual(["Lun", "Mar", "Sab"]);
  });
});
