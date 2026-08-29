import { readFile, readdir } from "node:fs/promises";
import { basename, extname, join, relative } from "node:path";
import type { AdapterId, SourceCandidate } from "../contracts.js";

const ignoredDirectories = new Set([".git", ".formproof", "dist", "node_modules", "coverage", ".venv", "__pycache__"]);

export interface FrameworkAdapter {
  id: AdapterId;
  displayName: string;
  sourceExtensions: string[];
}

const adapters: Record<AdapterId, FrameworkAdapter> = {
  static: { id: "static", displayName: "Static HTML", sourceExtensions: [".html", ".htm"] },
  react: { id: "react", displayName: "React / Next.js", sourceExtensions: [".tsx", ".jsx", ".ts", ".js", ".html"] },
  vue: { id: "vue", displayName: "Vue / Nuxt", sourceExtensions: [".vue", ".ts", ".js", ".html"] },
  flask: { id: "flask", displayName: "Flask / Jinja", sourceExtensions: [".html", ".jinja", ".jinja2", ".py"] },
  unknown: { id: "unknown", displayName: "Unknown web stack", sourceExtensions: [".html", ".tsx", ".jsx", ".vue", ".ts", ".js", ".py"] }
};

async function fileExists(path: string): Promise<boolean> {
  try {
    await readFile(path);
    return true;
  } catch {
    return false;
  }
}

async function readText(path: string): Promise<string> {
  try {
    return await readFile(path, "utf8");
  } catch {
    return "";
  }
}

async function walkFiles(root: string, limit = 2_000): Promise<string[]> {
  const files: string[] = [];
  const pending = [root];

  while (pending.length > 0 && files.length < limit) {
    const directory = pending.pop();
    if (!directory) continue;
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (files.length >= limit) break;
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!ignoredDirectories.has(entry.name)) pending.push(path);
      } else if (entry.isFile()) {
        files.push(path);
      }
    }
  }

  return files;
}

export async function detectAdapter(root: string): Promise<FrameworkAdapter> {
  const packagePath = join(root, "package.json");
  if (await fileExists(packagePath)) {
    try {
      const packageJson = JSON.parse(await readText(packagePath)) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      if ("react" in dependencies || "next" in dependencies) return adapters.react;
      if ("vue" in dependencies || "nuxt" in dependencies) return adapters.vue;
    } catch {
      // Malformed package metadata should not prevent fallback detection.
    }
  }

  const pythonMetadata = `${await readText(join(root, "requirements.txt"))}\n${await readText(join(root, "pyproject.toml"))}`;
  if (/\bflask\b/i.test(pythonMetadata)) return adapters.flask;

  const files = await walkFiles(root);
  if (files.some((path) => [".html", ".htm"].includes(extname(path).toLowerCase()))) return adapters.static;

  return adapters.unknown;
}

function candidateTokens(target: string[], html: string): Array<{ value: string; reason: string }> {
  const tokens: Array<{ value: string; reason: string }> = [];
  const combined = `${target.join(" ")} ${html}`;
  const idMatch = combined.match(/(?:#|\bid=["']?)([A-Za-z][\w:.-]*)/);
  if (idMatch?.[1]) tokens.push({ value: idMatch[1], reason: "element id match" });
  const nameMatch = combined.match(/\bname=["']([^"']+)["']/);
  if (nameMatch?.[1]) tokens.push({ value: nameMatch[1], reason: "control name match" });
  return tokens;
}

export async function mapNodeToSources(
  root: string,
  adapter: FrameworkAdapter,
  target: string[],
  html: string
): Promise<SourceCandidate[]> {
  const files = (await walkFiles(root)).filter((path) => adapter.sourceExtensions.includes(extname(path).toLowerCase()));
  const tokens = candidateTokens(target, html);
  const candidates: SourceCandidate[] = [];

  for (const file of files) {
    const text = await readText(file);
    for (const token of tokens) {
      if (text.includes(token.value)) {
        candidates.push({ path: relative(root, file).replaceAll("\\", "/"), confidence: "high", reason: token.reason });
        break;
      }
    }
  }

  if (candidates.length === 0 && files.length === 1) {
    candidates.push({ path: basename(files[0] as string), confidence: "low", reason: "only supported source file" });
  }

  return candidates.slice(0, 8);
}

export function getAdapter(id: AdapterId): FrameworkAdapter {
  return adapters[id];
}
