import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { analyze, type Budgets } from "./analyze.ts";
import { renderReport } from "./report-html.ts";
import { RESULTS_DIR, ROOT, type ResultSummary } from "./results.ts";

function readPreviousSummary(resultDir: string): ResultSummary | undefined {
  if (!existsSync(RESULTS_DIR)) {
    return undefined;
  }

  const current = basename(resultDir);
  const previous = readdirSync(RESULTS_DIR)
    .filter(
      (name) =>
        name < current && existsSync(join(RESULTS_DIR, name, "summary.json")),
    )
    .toSorted()
    .at(-1);

  return previous
    ? (JSON.parse(
        readFileSync(join(RESULTS_DIR, previous, "summary.json"), "utf8"),
      ) as ResultSummary)
    : undefined;
}

export function generateReport(resultDir: string): string {
  const budgets = JSON.parse(
    readFileSync(join(ROOT, "perf-budgets.json"), "utf8"),
  ) as Budgets;
  const report = analyze(resultDir, budgets, readPreviousSummary(resultDir));
  const reportPath = join(resultDir, "report.html");

  writeFileSync(reportPath, renderReport(report));
  writeFileSync(
    join(resultDir, "summary.json"),
    JSON.stringify(report.summary, null, 2),
  );

  return reportPath;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [target] = process.argv.slice(2);
  const latest = readdirSync(RESULTS_DIR).toSorted().at(-1);
  const resultDir = target ? resolve(target) : join(RESULTS_DIR, latest ?? "");

  console.log(`Report: ${generateReport(resultDir)}`);
}
