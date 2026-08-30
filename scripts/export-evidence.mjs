import { createHash } from "node:crypto";
import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

const [runDirectoryArg, outputDirectoryArg, experimentId, baseRepositoryCommit] =
  process.argv.slice(2);

if (!runDirectoryArg || !outputDirectoryArg || !experimentId || !baseRepositoryCommit) {
  throw new Error(
    "Usage: node scripts/export-evidence.mjs <run-directory> <output-directory> <experiment-id> <base-commit>"
  );
}

const repositoryRoot = resolve(".");
const runDirectory = resolve(runDirectoryArg);
const outputDirectory = resolve(outputDirectoryArg);
const userHome = process.env.USERPROFILE ? resolve(process.env.USERPROFILE) : "";
const sourceFiles = [
  "before.json",
  "after.json",
  "decision.json",
  "repair-prompt.md",
  "report.html"
];

await mkdir(outputDirectory, { recursive: true });

const trajectoryLines = (await readFile(resolve(runDirectory, "trajectory.jsonl"), "utf8"))
  .trim()
  .split(/\r?\n/)
  .map((line) => JSON.parse(line));
const threadId = trajectoryLines.find((event) => event.type === "thread.started")
  ?.thread_id;

function escaped(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sanitized(content) {
  const replacements = [
    [repositoryRoot.replaceAll("\\", "\\\\"), "<FORMPROOF_REPO>"],
    [repositoryRoot, "<FORMPROOF_REPO>"],
    [repositoryRoot.replaceAll("\\", "/"), "<FORMPROOF_REPO>"],
    [encodeURI(repositoryRoot.replaceAll("\\", "/")), "<FORMPROOF_REPO>"],
    [userHome.replaceAll("\\", "\\\\"), "<USER_HOME>"],
    [userHome, "<USER_HOME>"],
    [userHome.replaceAll("\\", "/"), "<USER_HOME>"],
    [encodeURI(userHome.replaceAll("\\", "/")), "<USER_HOME>"],
    [threadId ?? "", "<REDACTED_THREAD_ID>"]
  ].filter(([from]) => from.length > 0);

  const result = replacements.reduce(
    (result, [from, to]) => result.replace(new RegExp(escaped(from), "gi"), to),
    content
  );
  return result
    .replace(/[A-Za-z]:\\\\Users\\\\[^\\\r\n"']+/gi, "<USER_HOME>")
    .replace(/[A-Za-z]:\\Users\\[^\\\r\n"']+/gi, "<USER_HOME>")
    .replace(/[A-Za-z]:\/Users\/[^/\r\n"']+/gi, "<USER_HOME>")
    .replace(/<<FORMPROOF_REPO>[\\/]([^>]+)>/g, "../../$1");
}

function sanitizedObject(value) {
  return JSON.parse(
    JSON.stringify(value, (_key, item) =>
      typeof item === "string" ? sanitized(item) : item
    )
  );
}

for (const fileName of sourceFiles) {
  try {
    await access(resolve(runDirectory, fileName));
  } catch {
    continue;
  }
  const content = await readFile(resolve(runDirectory, fileName), "utf8");
  const exported = fileName.endsWith(".json")
    ? `${JSON.stringify(sanitizedObject(JSON.parse(content)), null, 2)}\n`
    : sanitized(content).replaceAll("\r\n", "\n");
  await writeFile(resolve(outputDirectory, fileName), exported);
}

const summary = await readFile(resolve(runDirectory, "agent-summary.txt"), "utf8");
await writeFile(
  resolve(outputDirectory, "agent-summary.md"),
  `${sanitized(summary).replaceAll("\r\n", "\n").trimEnd()}\n`
);

const representativeEvents = trajectoryLines.filter((event) => {
  if (["thread.started", "turn.started", "turn.completed"].includes(event.type)) {
    return true;
  }
  if (event.item?.type === "agent_message" || event.item?.type === "file_change") {
    return true;
  }
  if (event.item?.type !== "command_execution") return false;

  const command = event.item.command ?? "";
  return /regression|unittest|git diff/i.test(command);
});
const representativeTrajectory = representativeEvents
  .map((event) => JSON.stringify(sanitizedObject(event)))
  .join("\n");
await writeFile(
  resolve(outputDirectory, "representative-trajectory.jsonl"),
  `${representativeTrajectory}\n`
);

const before = JSON.parse(await readFile(resolve(runDirectory, "before.json"), "utf8"));
const after = JSON.parse(await readFile(resolve(runDirectory, "after.json"), "utf8"));
const decision = JSON.parse(await readFile(resolve(runDirectory, "decision.json"), "utf8"));
const artifactFiles = (await readdir(outputDirectory))
  .filter((fileName) => fileName !== "provenance.json")
  .sort();
const artifactSha256 = {};

for (const fileName of artifactFiles) {
  const content = await readFile(resolve(outputDirectory, fileName));
  artifactSha256[basename(fileName)] = createHash("sha256")
    .update(content)
    .digest("hex")
    .toUpperCase();
}

const provenance = {
  schemaVersion: "1.0",
  experimentId,
  baseRepositoryCommit,
  baselineRunId: before.runId,
  baselineCapturedAt: before.capturedAt,
  afterRunId: after.runId,
  afterCapturedAt: after.capturedAt,
  adapter: before.target.adapter,
  targetRuleIds: before.violations.map((violation) => violation.id),
  decision: decision.status,
  baselineReconstruction: "Use baseRepositoryCommit and before.json to reconstruct the frozen baseline.",
  sanitization: {
    repositoryRoot: "<FORMPROOF_REPO>",
    userHome: "<USER_HOME>",
    threadId: "<REDACTED_THREAD_ID>",
    trajectory:
      "Representative decision-relevant events; environment-specific skill and memory reads omitted."
  },
  artifactSha256
};

await writeFile(
  resolve(outputDirectory, "provenance.json"),
  `${JSON.stringify(provenance, null, 2)}\n`
);

console.log(`Exported ${artifactFiles.length} sanitized artifacts to ${outputDirectory}.`);
