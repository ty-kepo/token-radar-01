// Token radar: build the entry's output from the sealed snapshot.
//
// This is the entrypoint. It reads the frozen DefiLlama snapshot, scores every
// pre-token protocol with the comparables model in lib/model.ts, and writes the
// ranked board, the dashboard data, the dashboard itself, the screenshots and the
// dossier the judge reads. Node 22, standard library only, no network.
//
// Run it outside the grader with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input ../kit/input/snapshot.json

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { boardIssue, buildRadar, dataScript, parseSnapshot } from './lib/model.ts';
import { buildDossier } from './vendor/makefun-board.ts';

const root = fileURLToPath(new URL('.', import.meta.url));

// Caps from the scorer (reference/gate.json): the text cap shapes the dossier,
// the screenshot caps refuse anything over them.
const TEXT_MAX_BYTES = 65_536;
const SCREENSHOT_CAPS = {
  max: 4,
  max_bytes: 524_288,
};
const IMAGE_NAME = /^[A-Za-z0-9_][A-Za-z0-9._-]{0,127}$/;

// Read a --name <value> (or --name=<value>) argument, or fall back.
function arg(name: string, fallback: string): string {
  const flag = `--${name}`;
  const at = process.argv.indexOf(flag);
  if (at >= 0 && at + 1 < process.argv.length) {
    return process.argv[at + 1]!;
  }
  const joined = process.argv.find((a) => a.startsWith(`${flag}=`));
  if (joined === undefined) return fallback;
  return joined.slice(flag.length + 1);
}

// Print an error and stop with the given code.
function fail(message: string, code = 1): never {
  process.stderr.write(`token radar: ${message}\n`);
  process.exit(code);
}

// Resolve the snapshot path: a file, or a directory holding snapshot.json.
function snapshotPath(): string {
  const given = arg('input', '/input');
  if (given.endsWith('.json')) return given;
  return join(given, 'snapshot.json');
}

const path = snapshotPath();
if (!existsSync(path)) {
  fail(
    `no snapshot at ${path}: pass --input <snapshot.json|directory> or mount the sealed /input`,
    2,
  );
}
const out = arg('output', process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

// Score the snapshot and refuse a board the gate would reject.
const snapshot = parseSnapshot(readFileSync(path, 'utf8'));
const { board, radar } = buildRadar(snapshot);
const issue = boardIssue(board, snapshot);
if (issue !== null) {
  fail(`the model wrote a board the gate refuses: ${issue}`);
}

mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'board.json'), `${JSON.stringify({ rows: board })}\n`);
writeFileSync(join(out, 'data.js'), dataScript(radar));

// Copy one directory's regular files into `to`, skipping names that start with a dot.
function copyDir(from: string, to: string): string[] {
  if (!existsSync(from)) return [];
  mkdirSync(to, { recursive: true });
  const copied: string[] = [];
  for (const name of readdirSync(from)) {
    if (name.startsWith('.')) continue;
    const source = join(from, name);
    if (!statSync(source).isFile()) continue;
    copyFileSync(source, join(to, name));
    copied.push(name);
  }
  return copied;
}

copyDir(join(root, 'dashboard'), join(out, 'dashboard'));
const shots = copyDir(join(root, 'screenshots'), join(out, 'screenshots'));
if (shots.length < 3) {
  fail(
    `screenshots/ holds ${shots.length} image${shots.length === 1 ? '' : 's'}: ` +
      'hand in 3, the board, a detail view and a filtered view',
  );
}
for (const name of shots) {
  if (!IMAGE_NAME.test(name)) {
    fail(
      `screenshots/${name}: a name is letters, digits and . _ -, 1 to 128 characters`,
    );
  }
}

// The dossier goes last: the scorer rebuilds it from this /output and compares bytes.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: TEXT_MAX_BYTES,
    screenshots: SCREENSHOT_CAPS,
    dashboard: { max_files: 400, max_bytes: 4_194_304 },
  }),
);

process.stdout.write(
  `token radar: ${snapshot.protocols.length} protocols, ` +
    `${snapshot.watchlist.length} on the watchlist, ${board.length} rows scored ` +
    `(${radar.early_size} early, ${radar.live_size} live set aside)\n` +
    `token radar: wrote ${join(out, 'board.json')}, ${join(out, 'data.js')}, ` +
    `${join(out, 'dashboard')} (3 files), ${join(out, 'screenshots')} ` +
    `(${shots.length} images) and ${join(out, 'dossier.json')}\n`,
);
