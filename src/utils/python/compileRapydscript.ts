import { web_repl } from "./language-service.js";

export function compileRapydscript(code: string): string {
  const compiler = web_repl();
  return compiler.compile(code, { export_main: true, pythonize_strings: true, keep_baselib: true, tree_shaking: true });
}
