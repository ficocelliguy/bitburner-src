import { web_repl } from "./language-service.js";

let baselibInjected = false;

function injectBaselibOnce(): void {
  if (baselibInjected) return;
  baselibInjected = true;
  // Compile an empty program with keep_baselib:true to get just the baselib declarations.
  // Injecting via <script> puts var-declared names on window (globalThis), making them
  // visible to compiled player script ES modules without including them per-script.
  const baselibCode = web_repl().compile("", { keep_baselib: true });
  const script = document.createElement("script");
  script.textContent = baselibCode;
  document.head.appendChild(script);
  document.head.removeChild(script);
}

export function compileRapydscript(code: string): string {
  injectBaselibOnce();
  const compiler = web_repl();
  return compiler.compile(code, { export_main: true, pythonize_strings: true });
}
