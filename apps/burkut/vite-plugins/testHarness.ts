import { Writable } from "node:stream";
import type { Plugin, ViteDevServer } from "vite";

/**
 * A minimal stand-in for the connect middleware stack and the pieces of
 * `ViteDevServer` the content plugin touches, so the plugin's real middlewares
 * can be exercised in a test without booting Vite.
 *
 * Test-only helper — nothing in the app imports it.
 */

/** Collects a response the way node's ServerResponse would, streams included. */
export class FakeResponse extends Writable {
  statusCode = 200;
  headers: Record<string, string | number> = {};
  private chunks: Buffer[] = [];

  setHeader(name: string, value: string | number): void {
    this.headers[name.toLowerCase()] = value;
  }

  override _write(
    chunk: Buffer | string,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    this.chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    callback();
  }

  get body(): string {
    return Buffer.concat(this.chunks).toString("utf-8");
  }
}

type Middleware = (req: FakeRequest, res: FakeResponse, next: () => void) => void;

export interface FakeRequest {
  method: string;
  url: string;
  on(event: string, listener: (chunk?: Buffer) => void): FakeRequest;
  /** Replay the request body to the listeners the middleware registered. */
  flushBody(): void;
}

export function makeRequest(method: string, url: string, body?: string): FakeRequest {
  const listeners = new Map<string, ((chunk?: Buffer) => void)[]>();

  const request: FakeRequest = {
    method,
    url,
    on(event, listener) {
      const existing = listeners.get(event) ?? [];
      existing.push(listener);
      listeners.set(event, existing);
      return request;
    },
    flushBody() {
      if (body !== undefined) {
        for (const listener of listeners.get("data") ?? []) {
          listener(Buffer.from(body, "utf-8"));
        }
      }
      for (const listener of listeners.get("end") ?? []) {
        listener();
      }
    },
  };

  return request;
}

/** Collect the middlewares a plugin registers via `configureServer`. */
export function collectMiddlewares(plugin: Plugin): Middleware[] {
  const middlewares: Middleware[] = [];

  const server = {
    middlewares: {
      use(handler: Middleware) {
        middlewares.push(handler);
      },
    },
    watcher: {
      add() {},
      on() {},
    },
    moduleGraph: {
      getModuleById: () => null,
      invalidateModule() {},
    },
    ws: { send() {} },
  } as unknown as ViteDevServer;

  const hook = plugin.configureServer;
  if (typeof hook !== "function") throw new Error("configureServer is not a function hook");
  hook.call({} as never, server);

  return middlewares;
}

/**
 * Walk the collected middleware chain the way connect does, resolving once the
 * response has ended — including responses written by a piped file stream.
 */
export async function dispatch(
  middlewares: Middleware[],
  method: string,
  url: string,
  body?: string,
): Promise<FakeResponse> {
  const res = new FakeResponse();
  const req = makeRequest(method, url, body);
  const finished = new Promise<void>((resolveFinished, rejectFinished) => {
    res.on("finish", () => resolveFinished());
    res.on("error", rejectFinished);
  });

  let index = 0;
  let exhausted = false;

  const next = (): void => {
    const middleware = middlewares[index++];
    if (!middleware) {
      exhausted = true;
      return;
    }
    middleware(req, res, next);
  };

  next();
  req.flushBody();

  if (!res.writableEnded && !exhausted) {
    await finished;
  }

  return res;
}

/** Read the ContentGraph a plugin's `load` hook emits for the virtual module. */
export function loadVirtualPayload(plugin: Plugin, resolvedId: string): unknown {
  const hook = plugin.load;
  if (typeof hook !== "function") throw new Error("load is not a function hook");
  const code = hook.call({} as never, resolvedId, undefined);
  if (typeof code !== "string") throw new Error("load did not return module code");
  const json = code.replace(/^export default /, "").replace(/;\s*$/, "");
  return JSON.parse(json);
}
