import { web_repl } from "rapydscript-ns/language-service";

let baselibInjected = false;

function injectBaselibOnce(): void {
  if (baselibInjected) return;
  // Run the compiler, and cache the baselib's global scope, so it doesn't have to be recompiled for every new script update
  const baselibCode = web_repl().compile("", { keep_baselib: true });
  const script = document.createElement("script");
  script.textContent = baselibCode;
  document.head.appendChild(script);
  document.head.removeChild(script);
  baselibInjected = "ρσ_bool" in window;
}

let cachedEditorRepl: ReturnType<typeof web_repl> | null = null;

export function compileRapydscript(code: string, virtualFiles?: Record<string, string>): string {
  injectBaselibOnce();
  const opts: Record<string, unknown> = { export_all: true, tree_shake: true };
  if (virtualFiles) opts.virtual_files = virtualFiles;
  let result: string;
  try {
    cachedEditorRepl ??= web_repl();
    result = cachedEditorRepl.compile(code, opts);
  } catch (e) {
    cachedEditorRepl = null;
    throw e;
  }
  return result;
}

export function compileRapydscriptWithSourceMap(
  code: string,
  virtualFiles?: Record<string, string>,
): { scriptCode: string; sourceMap: string } {
  injectBaselibOnce();
  const compiler = web_repl();
  const opts: Record<string, unknown> = { export_all: true, tree_shake: true };
  if (virtualFiles) opts.virtual_files = virtualFiles;
  const result = compiler.compile_mapped(code, opts);
  return { scriptCode: result.code, sourceMap: result.sourceMap };
}
