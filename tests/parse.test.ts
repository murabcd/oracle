import { parseError } from "@/lib/error/parse";

describe("parseError", () => {
  it("returns string errors as-is", () => {
    expect(parseError("Request failed")).toBe("Request failed");
  });

  it("extracts the message from Error instances", () => {
    expect(parseError(new Error("Boom"))).toBe("Boom");
  });

  it("falls back for unknown values", () => {
    expect(parseError({ code: 500 })).toBe("An error occurred");
  });
});
