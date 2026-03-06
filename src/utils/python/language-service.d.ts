export declare const BASE_BUILTINS: string[];

export interface RapydScriptService {
  setVirtualFiles(files: Record<string, string>): void;
  removeVirtualFile(name: string): void;
  addGlobals(names: string[]): void;
  addDts(name: string, dtsText: string): void;
  loadDts(name: string): Promise<void>;
  dispose(): void;
}

export declare function web_repl(): {
  compile(code: string, opts?: Record<string, unknown>): string;
  is_input_complete(source: string): boolean;
  in_block_mode: boolean;
};

export declare function registerRapydScript(
  monaco: typeof import("monaco-editor"),
  options: {
    compiler?: object;
    extraBuiltins?: Record<string, unknown>;
    virtualFiles?: Record<string, string>;
    dtsFiles?: Array<{ name: string; content: string }>;
    parseDelay?: number;
    loadDts?: (name: string) => string | Promise<string>;
  },
): RapydScriptService;
