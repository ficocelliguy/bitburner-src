import { web_repl } from "./language-service.js";

export function compileRapydscript(code: string): string {
  const compiler = web_repl();
  return compiler.compile(code, { export_main: true });
}
