import { web_repl } from "rapydscript-ns/language-service";

let baselibInjected = false;

function injectBaselibOnce(): void {
  if (baselibInjected) return;
  baselibInjected = true;
  // Run the compiler, and cache the baselib's global scope, so it doesn't have to be recompiled for every new script update
  const baselibCode = web_repl().compile("", { keep_baselib: true });
  const script = document.createElement("script");
  script.textContent = baselibCode;
  document.head.appendChild(script);
  document.head.removeChild(script);
}

export function compileRapydscript(code: string, virtualFiles?: Record<string, string>): string {
  injectBaselibOnce();
  const compiler = web_repl();
  const opts: Record<string, unknown> = { export_main: true, tree_shake: true };
  if (virtualFiles) opts.virtual_files = virtualFiles;
  return compiler.compile(code, opts);
}

export function compileRapydscriptWithSourceMap(
  code: string,
  virtualFiles?: Record<string, string>,
): { scriptCode: string; sourceMap: string } {
  injectBaselibOnce();
  const compiler = web_repl();
  const opts: Record<string, unknown> = { export_main: true, tree_shake: true };
  if (virtualFiles) opts.virtual_files = virtualFiles;
  const result = compiler.compile_mapped(code, opts);
  return { scriptCode: result.code, sourceMap: result.sourceMap };
}
