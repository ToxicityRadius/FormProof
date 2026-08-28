#!/usr/bin/env node
import { parseArgs } from "node:util";
import { dirname, resolve } from "node:path";
import { inspectWorkflow, repairWorkflow } from "./core/workflow.js";

const help = `FormProof — evidence-gated web accessibility repair

Usage:
  formproof inspect --url <url> --source <directory> [--out <directory>]
  formproof repair --evidence <before.json> --approve [--out <directory>] [--test <command>] [--model <model>]

Commands:
  inspect  Freeze axe evidence, screenshot, repair prompt, and HTML report.
  repair   Run Codex only after --approve, then rescan and apply regression gates.

FormProof reports automated evidence. It does not certify WCAG conformance.`;

function defaultRunDirectory(command: string): string {
  const timestamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  return resolve(".formproof", "runs", `${timestamp}-${command}`);
}

function requireString(value: string | undefined, flag: string): string {
  if (!value) throw new Error(`Missing required option ${flag}`);
  return value;
}

async function main(argv: string[]): Promise<void> {
  const [command, ...args] = argv;
  if (!command || command === "help" || command === "--help" || command === "-h") {
    console.log(help);
    return;
  }

  if (command === "inspect") {
    const parsed = parseArgs({
      args,
      options: {
        url: { type: "string" },
        source: { type: "string" },
        out: { type: "string" }
      },
      strict: true
    });
    const result = await inspectWorkflow({
      url: requireString(parsed.values.url, "--url"),
      sourceRoot: resolve(requireString(parsed.values.source, "--source")),
      outDir: resolve(parsed.values.out ?? defaultRunDirectory("inspect"))
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "repair") {
    const parsed = parseArgs({
      args,
      options: {
        evidence: { type: "string" },
        approve: { type: "boolean", default: false },
        out: { type: "string" },
        test: { type: "string" },
        model: { type: "string" },
        rules: { type: "string", multiple: true }
      },
      strict: true
    });
    const beforePath = resolve(requireString(parsed.values.evidence, "--evidence"));
    const result = await repairWorkflow({
      beforePath,
      outDir: resolve(parsed.values.out ?? dirname(beforePath)),
      approved: parsed.values.approve,
      ...(parsed.values.test ? { regressionCommand: parsed.values.test } : {}),
      ...(parsed.values.model ? { model: parsed.values.model } : {}),
      ...(parsed.values.rules ? { targetViolationIds: parsed.values.rules } : {})
    });
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.decision.status === "VERIFIED_FIXED" ? 0 : 2;
    return;
  }

  throw new Error(`Unknown command: ${command}\n\n${help}`);
}

main(process.argv.slice(2)).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`FormProof error: ${message}`);
  process.exitCode = 1;
});
