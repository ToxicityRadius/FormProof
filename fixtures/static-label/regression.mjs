import { readFile } from "node:fs/promises";
import { join } from "node:path";

const html = await readFile(join(process.cwd(), "index.html"), "utf8");
const requiredBehaviorMarkers = [
  "<form>",
  'name="email"',
  'type="email"',
  '<button type="submit">Subscribe</button>'
];

const missing = requiredBehaviorMarkers.filter((marker) => !html.includes(marker));
if (missing.length > 0) {
  throw new Error(`Static fixture regression: missing ${missing.join(", ")}`);
}

console.log("Static fixture regression: form structure preserved.");
