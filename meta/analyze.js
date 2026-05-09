import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, "..");
const OUTPUT = resolve(SCRIPT_DIR, "loc.csv");
const SPACES = 2;
const TYPES = new Set(["html", "css", "js", "svelte"]);
const SKIP_DIRS = new Set([".git", "node_modules", "meta", "images", "lib"]);

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith(".") || SKIP_DIRS.has(entry)) {
      continue;
    }
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) {
      walk(full, files);
    } else {
      const ext = extname(full).slice(1).toLowerCase();
      if (TYPES.has(ext)) {
        files.push(full);
      }
    }
  }
  return files;
}

function indentDepth(text) {
  let depth = 0;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === "\t") {
      depth += 1;
      i += 1;
    } else if (ch === " ") {
      let count = 0;
      while (i < text.length && text[i] === " ") {
        count += 1;
        i += 1;
      }
      depth += Math.floor(count / SPACES);
    } else {
      break;
    }
  }
  return depth;
}

function blameFile(file) {
  const out = execFileSync(
    "git",
    ["blame", "--line-porcelain", "--", file],
    { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  const lines = out.split("\n");
  const records = [];
  let cur = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("\t")) {
      cur.content = line.slice(1);
      records.push(cur);
      cur = null;
      continue;
    }
    if (cur === null) {
      const [sha] = line.split(" ");
      cur = { sha };
      continue;
    }
    if (line.startsWith("author ")) {
      cur.author = line.slice("author ".length);
    } else if (line.startsWith("author-time ")) {
      cur.authorTime = parseInt(line.slice("author-time ".length), 10);
    } else if (line.startsWith("author-tz ")) {
      cur.authorTz = line.slice("author-tz ".length);
    }
  }
  return records;
}

function formatDateTime(unixSeconds, tz) {
  const sign = tz.startsWith("-") ? -1 : 1;
  const tzNum = tz.slice(1);
  const tzHours = parseInt(tzNum.slice(0, 2), 10);
  const tzMinutes = parseInt(tzNum.slice(2, 4), 10);
  const offsetSeconds = sign * (tzHours * 3600 + tzMinutes * 60);
  const local = new Date((unixSeconds + offsetSeconds) * 1000);
  const yyyy = local.getUTCFullYear();
  const mm = String(local.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(local.getUTCDate()).padStart(2, "0");
  const HH = String(local.getUTCHours()).padStart(2, "0");
  const MM = String(local.getUTCMinutes()).padStart(2, "0");
  const SS = String(local.getUTCSeconds()).padStart(2, "0");
  const tzPretty = `${tz.slice(0, 3)}:${tz.slice(3)}`;
  return {
    date: `${yyyy}-${mm}-${dd}`,
    time: `${HH}:${MM}:${SS}`,
    timezone: tzPretty,
    datetime: `${yyyy}-${mm}-${dd}T${HH}:${MM}:${SS}${tzPretty}`,
  };
}

function csvField(value) {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function main() {
  mkdirSync(SCRIPT_DIR, { recursive: true });
  const files = walk(ROOT);
  const header = [
    "file",
    "line",
    "type",
    "commit",
    "date",
    "time",
    "timezone",
    "datetime",
    "author",
    "depth",
    "length",
  ];
  const rows = [header.join(",")];

  for (const file of files) {
    const rel = relative(ROOT, file);
    const type = extname(file).slice(1).toLowerCase();
    let blame;
    try {
      blame = blameFile(file);
    } catch (err) {
      console.warn(`skipping ${rel}: ${err.message}`);
      continue;
    }
    blame.forEach((rec, idx) => {
      const text = rec.content ?? "";
      const trimmed = text.trim();
      const { date, time, timezone, datetime } = formatDateTime(
        rec.authorTime,
        rec.authorTz,
      );
      rows.push(
        [
          csvField(rel),
          idx + 1,
          csvField(type),
          csvField(rec.sha),
          csvField(date),
          csvField(time),
          csvField(timezone),
          csvField(datetime),
          csvField(rec.author),
          indentDepth(text),
          trimmed.length,
        ].join(","),
      );
    });
  }

  writeFileSync(OUTPUT, rows.join("\n") + "\n");
  console.log(`wrote ${rows.length - 1} lines to ${OUTPUT}`);
}

main();
