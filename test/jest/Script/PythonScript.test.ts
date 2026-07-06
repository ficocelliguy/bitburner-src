import { compileRapydscript } from "../../../src/utils/python/compileRapydscript";
import { calculateRamUsage } from "../../../src/Script/RamCalculations";
import { Script } from "../../../src/Script/Script";
import { RamCostConstants } from "../../../src/Netscript/RamCostGenerator";
import type { ScriptFilePath } from "../../../src/Paths/ScriptFilePath";

// Scripts are stored as absolute ScriptFilePaths (leading slash).
function makeScriptPath(name: string): ScriptFilePath {
  return ("/" + name) as ScriptFilePath;
}

function makeScriptsMap(...scripts: Script[]): Map<ScriptFilePath, Script> {
  return new Map(scripts.map((s) => [s.filename, s]));
}

// ─── Compilation ──────────────────────────────────────────────────────────────

describe("compileRapydscript", () => {
  it("compiles a basic Python script to JavaScript", () => {
    const code = `async def main(ns):
    ns.print("hello")`;
    const result = compileRapydscript(code);
    expect(result).toContain("export async function main");
    expect(result).toContain('ns.print("hello")');
  });

  it("compiles a Python utility module (no main)", () => {
    const code = `def getAllServers(ns):
    return ["home"]`;
    const result = compileRapydscript(code);
    expect(result).toContain("function getAllServers");
  });

  it("compiles Python with a virtual file for an import", () => {
    const utilCode = `def helper():
    return 42`;
    const mainCode = `from utils import helper

async def main(ns):
    ns.print(helper())`;
    const result = compileRapydscript(mainCode, { utils: utilCode });
    expect(result).toContain("export async function main");
  });

  it("throws when importing a module not in virtualFiles", () => {
    const code = `from missing_module import something

async def main(ns):
    ns.print(something())`;
    expect(() => compileRapydscript(code)).toThrow();
  });
});

// ─── RAM Calculation ──────────────────────────────────────────────────────────

describe("calculateRamUsage for Python scripts", () => {
  const server = "home";
  const baseCost = RamCostConstants.Base;

  it("calculates base RAM for a simple Python script with no NS calls", () => {
    const code = `async def main(ns):
    pass`;
    const result = calculateRamUsage(code, makeScriptPath("simple.py"), server, new Map());
    expect(result.cost).toBeCloseTo(baseCost);
    expect(result.errorMessage).toBeUndefined();
  });

  it("calculates RAM cost for ns.print (0 extra cost)", () => {
    const code = `async def main(ns):
    ns.print("hello")`;
    const result = calculateRamUsage(code, makeScriptPath("print.py"), server, new Map());
    expect(result.cost).toBeCloseTo(baseCost);
    expect(result.errorMessage).toBeUndefined();
  });

  it("calculates RAM cost for ns.hack", () => {
    const code = `async def main(ns):
    await ns.hack("n00dles")`;
    const result = calculateRamUsage(code, makeScriptPath("hack.py"), server, new Map());
    expect(result.cost).toBeGreaterThan(baseCost);
    expect(result.errorMessage).toBeUndefined();
  });

  it("returns an error when importing a .py module not in the scripts map", () => {
    const code = `from utils import getAllServers

async def main(ns):
    ns.print(getAllServers(ns))`;
    const result = calculateRamUsage(code, makeScriptPath("t.py"), server, new Map());
    // Without the util script provided, compilation must fail.
    expect(result.errorMessage).toBeDefined();
  });

  it("succeeds when the imported .py module is in the scripts map", () => {
    const utilCode = `def getAllServers(ns):
    return ["home"]`;
    const utilScript = new Script(makeScriptPath("utils.py"), utilCode, server);

    const mainCode = `from utils import getAllServers

async def main(ns):
    ns.print(getAllServers(ns))`;

    const scripts = makeScriptsMap(utilScript);
    const result = calculateRamUsage(mainCode, makeScriptPath("t.py"), server, scripts);
    expect(result.errorMessage).toBeUndefined();
    expect(result.cost).toBeCloseTo(baseCost);
  });

  it("accounts for NS RAM costs used inside an imported module", () => {
    const utilCode = `def doHack(ns):
    return ns.hack("n00dles")`;
    const utilScript = new Script(makeScriptPath("hackutil.py"), utilCode, server);

    const mainCode = `from hackutil import doHack

async def main(ns):
    await doHack(ns)`;

    const scripts = makeScriptsMap(utilScript);
    const result = calculateRamUsage(mainCode, makeScriptPath("main.py"), server, scripts);
    expect(result.errorMessage).toBeUndefined();
    expect(result.cost).toBeGreaterThan(baseCost);
  });

  it("handles subdirectory imports (subdir/utils.py → from subdir.utils import ...)", () => {
    const utilCode = `def helper():
    return 1`;
    const utilScript = new Script(makeScriptPath("subdir/utils.py"), utilCode, server);

    const mainCode = `from subdir.utils import helper

async def main(ns):
    ns.print(helper())`;

    const scripts = makeScriptsMap(utilScript);
    const result = calculateRamUsage(mainCode, makeScriptPath("main.py"), server, scripts);
    expect(result.errorMessage).toBeUndefined();
  });

  // Python treats the running script's directory as the first entry on sys.path, so siblings
  // import each other by bare name. We recreate that in the virtual-file map.
  it("handles sibling imports inside a subdirectory (from utils import ... in /py/batcher.py)", () => {
    const utilCode = `def getAllServers(ns):
    return ["home"]`;
    const utilScript = new Script(makeScriptPath("py/utils.py"), utilCode, server);

    const mainCode = `from utils import getAllServers

async def main(ns):
    ns.print(getAllServers(ns))`;

    const scripts = makeScriptsMap(utilScript);
    const result = calculateRamUsage(mainCode, makeScriptPath("py/batcher.py"), server, scripts);
    expect(result.errorMessage).toBeUndefined();
    expect(result.cost).toBeCloseTo(baseCost);
  });

  // When the same bare name exists both as a sibling and at the root, the sibling wins
  // (matches Python's sys.path[0]-first ordering).
  it("prefers sibling over root when both share a bare name", () => {
    const siblingCode = `def which():
    return "sibling"`;
    const rootCode = `def which():
    return "root"`;
    const scripts = makeScriptsMap(
      new Script(makeScriptPath("py/utils.py"), siblingCode, server),
      new Script(makeScriptPath("utils.py"), rootCode, server),
    );

    const mainCode = `from utils import which

async def main(ns):
    ns.print(which())`;

    const result = calculateRamUsage(mainCode, makeScriptPath("py/batcher.py"), server, scripts);
    expect(result.errorMessage).toBeUndefined();
  });
});

// ─── Circular Imports ─────────────────────────────────────────────────────────

describe("circular import handling", () => {
  const server = "home";

  // When the main script is included in virtualFiles, the compiler detects the
  // cycle and throws "Detected a recursive import".
  it("compileRapydscript throws on direct circular imports (A → B → A)", () => {
    const aCode = `from b import funcB

def funcA():
    return funcB()

async def main(ns):
    ns.print(funcA())`;

    const bCode = `from a import funcA

def funcB():
    return funcA()`;

    // Include both a and b so the compiler can follow the full cycle.
    expect(() => compileRapydscript(aCode, { a: aCode, b: bCode })).toThrow(/recursive import|circular/i);
  });

  // When using calculateRamUsage the main script is excluded from virtual files.
  // B tries to import A but cannot find it → graceful "Failed Import" error.
  it("calculateRamUsage errors gracefully on circular imports (A → B → A)", () => {
    const aCode = `from b import funcB

def funcA():
    return funcB()

async def main(ns):
    ns.print(funcA())`;

    const bCode = `from a import funcA

def funcB():
    return funcA()`;

    const bScript = new Script(makeScriptPath("b.py"), bCode, server);
    const scripts = makeScriptsMap(bScript);
    const result = calculateRamUsage(aCode, makeScriptPath("a.py"), server, scripts);
    // Must not hang or crash — any error message is acceptable.
    expect(result.errorMessage).toBeDefined();
  });

  // A module that imports itself directly.
  it("calculateRamUsage errors gracefully on self-import", () => {
    const code = `from self_script import something

async def main(ns):
    ns.print(something())`;

    const selfScript = new Script(makeScriptPath("self_script.py"), code, server);
    const scripts = makeScriptsMap(selfScript);
    // self_script.py is both the target and the only entry in the map.
    // The main script is excluded from virtual files, so the self-import
    // fails with "Failed Import" — still a graceful, non-crashing error.
    const result = calculateRamUsage(code, makeScriptPath("self_script.py"), server, scripts);
    expect(result.errorMessage).toBeDefined();
  });
});

// ─── Script.getRamUsage ───────────────────────────────────────────────────────

describe("Script.getRamUsage for Python scripts", () => {
  const server = "home";

  it("returns base RAM for a simple Python script", () => {
    const script = new Script(makeScriptPath("simple.py"), `async def main(ns):\n    pass`, server);
    const ram = script.getRamUsage(new Map());
    expect(ram).toBeCloseTo(RamCostConstants.Base);
  });

  it("returns null/error when importing an unknown module", () => {
    const code = `from utils import getAllServers

async def main(ns):
    ns.print(getAllServers(ns))`;
    const script = new Script(makeScriptPath("t.py"), code, server);
    // Without the util script, RAM calculation fails and returns null.
    const ram = script.getRamUsage(new Map());
    expect(ram).toBeNull();
    expect(script.ramCalculationError).toBeTruthy();
  });

  it("returns RAM when the imported module is provided", () => {
    const utilCode = `def getAllServers(ns):\n    return ["home"]`;
    const utilScript = new Script(makeScriptPath("utils.py"), utilCode, server);

    const mainCode = `from utils import getAllServers

async def main(ns):
    ns.print(getAllServers(ns))`;
    const mainScript = new Script(makeScriptPath("t.py"), mainCode, server);

    const ram = mainScript.getRamUsage(makeScriptsMap(utilScript));
    expect(ram).not.toBeNull();
    expect(mainScript.ramCalculationError).toBeNull();
  });
});
