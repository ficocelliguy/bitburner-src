import "./rapydscript.js";

export function compileRapydscript(code: string): string {
  // rapydscript.js sets globalThis.RapydScript as a side effect (not CJS exports)
  // @ts-expect-error
  // eslint-disable-next-line
  const compiler = globalThis.RapydScript.web_repl();
  // eslint-disable-next-line
  return compiler.compile(code, { export_main: true });
}