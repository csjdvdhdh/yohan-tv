import { afterEach, describe, expect, it, vi } from "vitest";
import { searchMedia } from "./akwam-api";

describe("akwam api parser", () => {
  afterEach(() => vi.restoreAllMocks());

  it("parses a media card from search HTML", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: async () => `
      <a href="https://ak.sv/movie/11331/batman-knightfall"><img src="https://img.downet.net/thumb/178x260/uploads/poster.jpg" alt="x"></a>
      <h3>Batman: Knightfall</h3><div>2026 WEB-DL ★ 8.1</div>
    ` }));
    const results = await searchMedia("batman");
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ id: "11331", href: "https://ak.sv/movie/11331/batman-knightfall", poster: "https://img.downet.net/thumb/178x260/uploads/poster.jpg" });
  });
});
