import { describe, it, expect } from "vitest";
import { stripCaseTypePrefix } from "@/lib/utils";

describe("stripCaseTypePrefix", () => {
  it("removes VORSORGE: prefix", () => {
    expect(stripCaseTypePrefix("VORSORGE: Mustermann, Max")).toBe("Mustermann, Max");
  });

  it("removes TRAUERFALL: prefix", () => {
    expect(stripCaseTypePrefix("TRAUERFALL: Schmidt, Anna")).toBe("Schmidt, Anna");
  });

  it("removes BERATUNG: prefix", () => {
    expect(stripCaseTypePrefix("BERATUNG: Weber, Peter")).toBe("Weber, Peter");
  });

  it("handles case insensitivity", () => {
    expect(stripCaseTypePrefix("vorsorge: Test")).toBe("Test");
  });

  it("returns name unchanged when no prefix", () => {
    expect(stripCaseTypePrefix("Mustermann, Max")).toBe("Mustermann, Max");
  });

  it("trims whitespace", () => {
    expect(stripCaseTypePrefix("VORSORGE:  Mustermann  ")).toBe("Mustermann");
  });
});
