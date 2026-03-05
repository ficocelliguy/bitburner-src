import { compileRapydscript } from "../../../src/utils/python/compileRapydscript";


describe("parsePython", () => {
  it("should parse a simple Python script", () => {
    const script = `async def main(ns):
    ns.print("Hello, world!")`;
    const result = compileRapydscript(script);
    expect(result).toContain("export async function main(ns)");
    expect(result).toContain('ns.print("Hello, world!")');
  })
});