/* tslint:disable */
/* eslint-disable */
export class Game {
  free(): void;
  constructor();
  draw(): void;
  play(): void;
  update(time: number): void;
  toggle_pause(): void;
  is_paused(): boolean;
  is_game_over(): boolean;
  handle_key(key: string): void;
  update_score(): void;
  check_game_over(): void;
  set_color_scheme(scheme: string): void;
  set_background_color(color: string): void;
  get_background_names(): Array<any>;
  get_background_path(name: string): string | undefined;
  set_background(background: string): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_game_free: (a: number, b: number) => void;
  readonly game_new: () => [number, number, number];
  readonly game_draw: (a: number) => void;
  readonly game_play: (a: number) => void;
  readonly game_update: (a: number, b: number) => void;
  readonly game_toggle_pause: (a: number) => void;
  readonly game_is_paused: (a: number) => number;
  readonly game_is_game_over: (a: number) => number;
  readonly game_handle_key: (a: number, b: number, c: number) => void;
  readonly game_update_score: (a: number) => void;
  readonly game_check_game_over: (a: number) => void;
  readonly game_set_color_scheme: (a: number, b: number, c: number) => [number, number];
  readonly game_set_background_color: (a: number, b: number, c: number) => [number, number];
  readonly game_get_background_names: (a: number) => any;
  readonly game_get_background_path: (a: number, b: number, c: number) => [number, number];
  readonly game_set_background: (a: number, b: number, c: number) => [number, number];
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_1: WebAssembly.Table;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
