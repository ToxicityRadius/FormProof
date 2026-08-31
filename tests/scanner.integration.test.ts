import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { scanUrl } from "../src/scanner/axe-scanner.js";

const inaccessiblePage = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>FormProof fixture</title></head>
  <body>
    <main>
      <h1>Newsletter</h1>
      <form><input id="email" type="email"><button>Subscribe</button></form>
    </main>
  </body>
</html>`;

let server: ReturnType<typeof createServer>;
let url: string;

beforeAll(async () => {
  server = createServer((request, response) => {
    const status = request.url === "/503" ? 503 : request.url === "/404" ? 404 : 200;
    response.writeHead(status, { "content-type": "text/html; charset=utf-8" });
    response.end(inaccessiblePage);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as AddressInfo;
  url = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

describe("scanUrl", () => {
  it.each([404, 503])("rejects HTTP %i instead of returning accessibility evidence", async (status) => {
    await expect(scanUrl({
      url: `${url}/${status}`,
      sourceRoot: new URL("../fixtures/static-label", import.meta.url).pathname
    })).rejects.toThrow(`HTTP ${status}`);
  });

  it("captures an axe label violation in the normalized evidence contract", async () => {
    const evidence = await scanUrl({
      url,
      sourceRoot: new URL("../fixtures/static-label", import.meta.url).pathname
    });

    expect(evidence.target.adapter).toBe("static");
    expect(evidence.violations.map((violation) => violation.id)).toContain("label");
    expect(evidence.totals.nodes).toBeGreaterThan(0);
  });
});
