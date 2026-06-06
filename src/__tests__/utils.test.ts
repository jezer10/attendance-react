import { describe, expect, it } from "vitest";
import { extractOffsetMinutes, toUtcTime } from "../features/automation/components/utils";

describe("utils — extractOffsetMinutes", () => {
  it("returns 0 for empty / undefined", () => {
    expect(extractOffsetMinutes(undefined)).toBe(0);
    expect(extractOffsetMinutes("")).toBe(0);
  });

  it("returns 0 for non-UTC timezones", () => {
    expect(extractOffsetMinutes("America/Lima")).toBe(0);
  });

  it("parses negative offsets", () => {
    expect(extractOffsetMinutes("UTC-05:00 America/Lima")).toBe(-5 * 60);
  });

  it("parses positive offsets including minutes", () => {
    expect(extractOffsetMinutes("UTC+05:30 Asia/Kolkata")).toBe(5 * 60 + 30);
  });
});

describe("utils — toUtcTime", () => {
  it("returns null for invalid input", () => {
    expect(toUtcTime("not-a-time", 0)).toBeNull();
    expect(toUtcTime("", 0)).toBeNull();
  });

  it("returns the same time when offset is zero", () => {
    expect(toUtcTime("08:00", 0)).toBe("08:00");
  });

  it("subtracts the offset (local -> UTC)", () => {
    expect(toUtcTime("08:00", -5 * 60)).toBe("13:00");
  });

  it("wraps around midnight forward", () => {
    expect(toUtcTime("23:30", -5 * 60)).toBe("04:30");
  });

  it("wraps around midnight backward", () => {
    expect(toUtcTime("01:00", 5 * 60)).toBe("20:00");
  });
});
