import { compilePython } from "../../../src/utils/python/parsePython";


describe("parsePython", () => {
  it("should parse a simple Python script", () => {
    const script = `async def main(ns):
    ns.print("Hello, world!")`;
    const result = compilePython(script);
    expect(result).toContain("export async function main(ns)");
    expect(result).toContain('ns.print("Hello, world!")');
  })
});