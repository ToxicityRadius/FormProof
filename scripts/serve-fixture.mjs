import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

const [directory = "fixtures/static-label", portText = "4173"] = process.argv.slice(2);
const root = resolve(directory);
const port = Number.parseInt(portText, 10);
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"]
]);

if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error(`Invalid port: ${portText}`);

const server = createServer(async (request, response) => {
  const requested = decodeURIComponent(new URL(request.url ?? "/", "http://127.0.0.1").pathname);
  const relativePath = requested === "/" ? "index.html" : normalize(requested).replace(/^[/\\]+/, "");
  const path = join(root, relativePath);
  if (path !== root && !path.startsWith(`${root}${sep}`)) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  try {
    const metadata = await stat(path);
    if (!metadata.isFile()) throw new Error("Not a file");
    response.writeHead(200, { "content-type": contentTypes.get(extname(path)) ?? "application/octet-stream" });
    createReadStream(path).pipe(response);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Serving ${root} at http://127.0.0.1:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
