/**
 * Runs HackingBonusComparison.test.ts as one jest process per scenario/seed, several at a time, then merges the
 * per-process results into <out>/hacking-bonus-sim.json.
 *
 * Each process gets its own copy of the game's global state, so runs can't interfere with each other.
 *
 * Usage:
 *   node test/jest/Simulations/runParallel.js [--scenarios a,b] [--seeds 1,2] [--concurrency N] [--out dir]
 *
 *   --scenarios    scenario kinds to run (default: all)
 *   --seeds        seeds to run for every chosen scenario (default: 5 random seeds for cyberdeck scenarios, 1 random
 *                  seed for the rest, fresh every invocation)
 *   --concurrency  max jest processes at once (default: min(cores - 2, 10)); each uses ~1-2GB of memory
 *   --out          output directory (default: SIM_OUT_DIR or ./sim-output)
 *   --hours        simulated hours per run (default: SIM_HOURS or 6)
 *
 * Progress from every process goes to <tmp>/bitburner-sim/progress.log (or SIM_PROGRESS_FILE).
 */
/* eslint-env node */
// Plain Node script (CommonJS, untyped), so the TypeScript-only rules this folder's lint config applies don't fit it
/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment,
   @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument,
   @typescript-eslint/no-unsafe-return */
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const ALL_SCENARIOS = ["baseline", "stanek", "go-illuminati", "go-wd", "cyberdeck-focus", "cyberdeck-nofocus"];
const CYBERDECK_SEED_COUNT = 5;

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else if (arg.startsWith("--")) {
      args[arg.slice(2)] = argv[++i];
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  const header = fs.readFileSync(__filename, "utf8").split("*/")[0];
  console.log(header.replace(/^\/\*\*|^ \* ?/gm, ""));
  process.exit(0);
}

const repoRoot = path.resolve(__dirname, "../../..");
const outDir = path.resolve(args.out ?? process.env.SIM_OUT_DIR ?? path.join(repoRoot, "sim-output"));
const partsDir = path.join(outDir, "parts");
const progressFile = process.env.SIM_PROGRESS_FILE ?? path.join(os.tmpdir(), "bitburner-sim", "progress.log");
const concurrency = Number(args.concurrency ?? Math.max(1, Math.min(os.cpus().length - 2, 10)));
const scenarios = args.scenarios ? args.scenarios.split(",") : ALL_SCENARIOS;
const hours = String(args.hours ?? process.env.SIM_HOURS ?? 6);
const seedOverride = args.seeds ? args.seeds.split(",").map(Number) : null;

for (const s of scenarios) {
  if (!ALL_SCENARIOS.includes(s)) {
    console.error(`Unknown scenario "${s}". Known: ${ALL_SCENARIOS.join(", ")}`);
    process.exit(1);
  }
}

const randomSeed = () => 1 + Math.floor(Math.random() * 1e6);
const jobs = scenarios.flatMap((kind) =>
  (seedOverride ?? Array.from({ length: kind.startsWith("cyberdeck") ? CYBERDECK_SEED_COUNT : 1 }, randomSeed)).map(
    (seed) => ({ kind, seed }),
  ),
);

fs.mkdirSync(partsDir, { recursive: true });
fs.mkdirSync(path.dirname(progressFile), { recursive: true });
fs.writeFileSync(progressFile, "");

function log(message) {
  const line = `${new Date().toISOString().slice(11, 19)} {launcher} ${message}`;
  fs.appendFileSync(progressFile, line + "\n");
  console.log(line);
}

const jestBin = require.resolve("jest/bin/jest", { paths: [repoRoot] });
const testFile = "test/jest/Simulations/HackingBonusComparison";
const partFile = (job) => `part-${job.kind}-${job.seed}.json`;

function runJob(job) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(process.execPath, [jestBin, testFile, "--silent"], {
      cwd: repoRoot,
      env: {
        ...process.env,
        SIM_RUN: "1",
        SIM_OUT_DIR: partsDir,
        SIM_RESULTS_FILE: partFile(job),
        SIM_SCENARIOS: job.kind,
        SIM_SEEDS: String(job.seed),
        SIM_PROGRESS_FILE: progressFile,
        SIM_PROGRESS_APPEND: "1",
        SIM_TAG: `${job.kind} s${job.seed}`,
        SIM_HOURS: hours,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.on("data", (d) => (output += d));
    child.stderr.on("data", (d) => (output += d));
    child.on("close", (code) => {
      const seconds = ((Date.now() - started) / 1000).toFixed(0);
      if (code !== 0) fs.writeFileSync(path.join(partsDir, `error-${job.kind}-${job.seed}.log`), output);
      resolve({ job, code, seconds });
    });
  });
}

async function main() {
  log(`running ${jobs.length} jobs (${hours}h each), ${concurrency} at a time -> ${outDir}`);
  const queue = [...jobs];
  const results = [];
  let done = 0;
  const workers = Array.from({ length: Math.min(concurrency, jobs.length) }, async () => {
    while (queue.length) {
      const job = queue.shift();
      const result = await runJob(job);
      results.push(result);
      done++;
      log(
        `${result.code === 0 ? "done" : "FAILED"} ${job.kind} seed ${job.seed} in ${result.seconds}s (${done}/${
          jobs.length
        })`,
      );
    }
  });
  await Promise.all(workers);

  // Merge per-process results in a stable order
  const merged = [];
  for (const job of jobs) {
    const file = path.join(partsDir, partFile(job));
    if (fs.existsSync(file)) merged.push(...JSON.parse(fs.readFileSync(file, "utf8")));
  }
  const resultsFile = path.join(outDir, "hacking-bonus-sim.json");
  fs.writeFileSync(resultsFile, JSON.stringify(merged));
  const failed = results.filter((r) => r.code !== 0);
  log(`all done: ${merged.length} runs merged into ${resultsFile}${failed.length ? `, ${failed.length} FAILED` : ""}`);
  process.exit(failed.length ? 1 : 0);
}

void main();
