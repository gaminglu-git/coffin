import { describe, it, expect } from "vitest";
import { caseWizardSchema, caseUpdateSchema } from "@/lib/validations/case";

describe("caseWizardSchema", () => {
  const validData = {
    wishes: { burialType: "Feuerbestattung" as const, specialWishes: "" },
    deceased: { firstName: "Max", lastName: "Mustermann" },
    contact: {},
  };

  it("accepts valid data", () => {
    const result = caseWizardSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects missing deceased firstName", () => {
    const result = caseWizardSchema.safeParse({
      ...validData,
      deceased: { ...validData.deceased, firstName: "" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing deceased lastName", () => {
    const result = caseWizardSchema.safeParse({
      ...validData,
      deceased: { ...validData.deceased, lastName: "" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = caseWizardSchema.safeParse({
      ...validData,
      contact: { email: "invalid-email" },
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid email", () => {
    const result = caseWizardSchema.safeParse({
      ...validData,
      contact: { email: "test@example.com" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid burial type", () => {
    const result = caseWizardSchema.safeParse({
      ...validData,
      wishes: { ...validData.wishes, burialType: "Invalid" },
    });
    expect(result.success).toBe(false);
  });
});

describe("caseUpdateSchema", () => {
  it("accepts valid status update", () => {
    const result = caseUpdateSchema.safeParse({ status: "In Planung" });
    expect(result.success).toBe(true);
  });

  it("accepts valid caseType", () => {
    const result = caseUpdateSchema.safeParse({ caseType: "trauerfall" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = caseUpdateSchema.safeParse({ status: "InvalidStatus" });
    expect(result.success).toBe(false);
  });

  it("accepts empty object", () => {
    const result = caseUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
