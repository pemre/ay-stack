declare module "vis-timeline/standalone" {
  export class DataSet<T = Record<string, unknown>> {
    constructor(data?: T[]);
    add(data: T | T[]): void;
    clear(): void;
    get(id: string | number): T | null;
  }

  export class Timeline {
    constructor(
      container: HTMLElement,
      // biome-ignore lint/suspicious/noExplicitAny: vis-timeline accepts any DataSet
      items: DataSet<any>,
      // biome-ignore lint/suspicious/noExplicitAny: vis-timeline accepts any DataSet
      groups: DataSet<any>,
      options?: Record<string, unknown>,
    );
    on(event: string, callback: (props: Record<string, unknown>) => void): void;
    destroy(): void;
    setSelection(ids: (string | number)[]): void;
    focus(id: string | number): void;
    getWindow(): { start: number; end: number };
    moveTo(time: Date, options?: Record<string, unknown>): void;
    redraw(): void;
  }
}
