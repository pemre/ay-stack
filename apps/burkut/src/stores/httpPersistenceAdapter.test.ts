import { afterEach, describe, expect, it, vi } from "vitest";
import { httpLayoutPersistenceAdapter } from "./httpPersistenceAdapter.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("httpLayoutPersistenceAdapter", () => {
  it("loads and migrates persisted dashboard documents", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            version: 1,
            dashboards: [
              {
                id: "dashboard-1",
                name: "Dashboard",
                instances: [
                  {
                    instanceId: "instance-1",
                    widgetTypeId: "sidebar",
                    position: { x: 0, y: 0, w: 2, h: 2 },
                    config: { type: "sidebar", tags: [], contentType: null },
                  },
                ],
                filter: {},
              },
            ],
          }),
          { status: 200 },
        ),
      ),
    );

    const result = await httpLayoutPersistenceAdapter.load();

    expect(result?.version).toBe(2);
    expect(result?.dashboards[0]?.instances[0]?.widgetTypeId).toBe("tree-list");
  });

  it("returns null when the endpoint is not available", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 404 })));

    await expect(httpLayoutPersistenceAdapter.load()).resolves.toBeNull();
  });

  it("saves the current version as a JSON document", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetch);

    await httpLayoutPersistenceAdapter.save({ version: 1, dashboards: [] });

    expect(fetch).toHaveBeenCalledWith(
      "/api/layouts",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ version: 2, dashboards: [] }),
      }),
    );
  });
});
