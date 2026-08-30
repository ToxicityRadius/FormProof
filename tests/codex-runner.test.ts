import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildCodexArgs, buildRepairPrompt, runCodexRepair } from "../src/agent/codex-runner.js";
import type { ScanEvidence } from "../src/contracts.js";

const evidence: ScanEvidence = {
  schemaVersion: "1.0",
  runId: "codex-test",
  capturedAt: "2026-08-29T00:00:00.000Z",
  target: { url: "http://127.0.0.1:4173", sourceRoot: "C:/fixture", adapter: "react" },
  violations: [
    {
      id: "label",
      impact: "serious",
      description: "Form elements must have labels",
      help: "Form elements must have labels",
      helpUrl: "https://deque.example/label",
      tags: ["wcag2a"],
      nodes: []
    }
  ],
  totals: { violations: 1, nodes: 0 }
};

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("Codex runner", () => {
  it("uses non-interactive JSONL output and the approval-reviewed workspace-write route", () => {
    const args = buildCodexArgs({
      sourceRoot: "C:/fixture",
      trajectoryPath: "C:/run/trajectory.jsonl",
      lastMessagePath: "C:/run/agent-summary.txt"
    });

    expect(args).toEqual(expect.arrayContaining([
      "exec",
      "--json",
      "--approve-for-me",
      "--disable",
      "memories",
      "--cd",
      "C:/fixture",
      "--output-last-message",
      "C:/run/agent-summary.txt",
      "-"
    ]));
    expect(args).not.toContain("--sandbox");
    expect(args).not.toContain("--dangerously-bypass-approvals-and-sandbox");
  });

  it("instructs the agent to make a minimal source repair without claiming conformance", () => {
    const prompt = buildRepairPrompt(evidence, ["label"], "npm test");

    expect(prompt).toContain("label");
    expect(prompt).toContain("minimal source-level patch");
    expect(prompt).toContain("Do not claim WCAG conformance");
    expect(prompt).toContain("untrusted data");
    expect(prompt).toContain("npm test");
  });

  it("uses the optional model and default regression guidance", () => {
    const args = buildCodexArgs({
      sourceRoot: "C:/fixture",
      trajectoryPath: "C:/run/trajectory.jsonl",
      lastMessagePath: "C:/run/agent-summary.txt",
      model: "gpt-test",
      reasoningEffort: "medium"
    });

    expect(args).toEqual(expect.arrayContaining(["--model", "gpt-test"]));
    expect(args).toEqual(expect.arrayContaining(["-c", 'model_reasoning_effort="medium"']));
    expect(buildRepairPrompt(evidence, ["label"])).toContain("existing focused test command");
  });

  it("captures a non-interactive child process trajectory and exit code", async () => {
    const root = await mkdtemp(join(tmpdir(), "formproof-runner-"));
    temporaryDirectories.push(root);
    const fakeAgentPath = join(root, "fake-agent.mjs");
    const trajectoryPath = join(root, "run", "trajectory.jsonl");
    const lastMessagePath = join(root, "run", "agent-summary.txt");
    await writeFile(fakeAgentPath, `
      import { writeFileSync } from "node:fs";
      const args = process.argv.slice(2);
      const outputIndex = args.indexOf("--output-last-message");
      let prompt = "";
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", (chunk) => { prompt += chunk; });
      process.stdin.on("end", () => {
        writeFileSync(args[outputIndex + 1], "fake summary");
        process.stdout.write(JSON.stringify({ type: "result", promptLength: prompt.length }) + "\\n");
        process.stderr.write("fake warning");
      });
    `, "utf8");

    const result = await runCodexRepair({
      sourceRoot: root,
      trajectoryPath,
      lastMessagePath,
      prompt: "repair safely",
      executable: process.execPath,
      executableArgs: [fakeAgentPath]
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("fake warning");
    await expect(readFile(trajectoryPath, "utf8")).resolves.toContain('"type":"result"');
    await expect(readFile(lastMessagePath, "utf8")).resolves.toBe("fake summary");
  });

  it("records a failing child process exit code", async () => {
    const root = await mkdtemp(join(tmpdir(), "formproof-runner-fail-"));
    temporaryDirectories.push(root);
    const fakeAgentPath = join(root, "fake-agent.mjs");
    await writeFile(fakeAgentPath, "process.stdin.resume(); process.stdin.on('end', () => process.exit(7));", "utf8");

    const result = await runCodexRepair({
      sourceRoot: root,
      trajectoryPath: join(root, "trajectory.jsonl"),
      lastMessagePath: join(root, "agent-summary.txt"),
      prompt: "repair safely",
      executable: process.execPath,
      executableArgs: [fakeAgentPath]
    });

    expect(result.exitCode).toBe(7);
    expect(result.timedOut).toBe(false);
  });

  it("terminates an agent that exceeds its timeout", async () => {
    const root = await mkdtemp(join(tmpdir(), "formproof-runner-timeout-"));
    temporaryDirectories.push(root);
    const fakeAgentPath = join(root, "fake-agent.mjs");
    await writeFile(fakeAgentPath, "process.stdin.resume(); setInterval(() => {}, 1000);", "utf8");

    const result = await runCodexRepair({
      sourceRoot: root,
      trajectoryPath: join(root, "trajectory.jsonl"),
      lastMessagePath: join(root, "agent-summary.txt"),
      prompt: "repair safely",
      executable: process.execPath,
      executableArgs: [fakeAgentPath],
      timeoutMs: 50
    });

    expect(result.timedOut).toBe(true);
    expect(result.exitCode).toBe(124);
  });
});
