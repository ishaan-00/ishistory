/**
 * ishistory — Frontmatter Validator
 * ─────────────────────────────────────────────────────────────────────────────
 * Validates every touched .md file before on-publish.yml fires.
 * Runs zero-dep — no npm install needed.
 *
 * Checks per-file:
 *   • Required fields present (title, series, date, episode_number, description)
 *   • Field types correct (date is valid, episode_number is positive integer)
 *   • Series is one of the known series directories
 *   • Date not more than 30 days in the future
 *   • description under 300 chars
 *   • No stale devto_id/hashnode_id on a brand-new file (copy-paste guard)
 *   • Filename matches expected pattern for the series
 *
 * Cross-file checks (requires full checkout):
 *   • episode_number not already used by another file in same series
 *   • No duplicate titles within a series
 *   • Episode gaps — warns if sequence has holes
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir     = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dir, '../..');

// ─── Config ───────────────────────────────────────────────────────────────────
const KNOWN_SERIES = ['ai-history', 'internet-history', 'robotics'];

const FILENAME_PATTERNS = {
  'ai-history':       [/^episode-\d+\.md$/, /^profile-\d+-[\w-]+\.md$/],
  'internet-history': [/^internet-\d+\.md$/],
  'robotics':         [/^robotics-\d+\.md$/],
};

const MAX_DESCRIPTION_CHARS = 300;
const MAX_FUTURE_DAYS       = 30;

// ─── Logger ───────────────────────────────────────────────────────────────────
const RESET  = '\x1b[0m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN  = '\x1b[32m';
const CYAN   = '\x1b[36m';
const BOLD   = '\x1b[1m';
const DIM    = '\x1b[2m';

const log = {
  info:    (...a) => console.log(DIM + '  ·' + RESET, ...a),
  ok:      (...a) => console.log(GREEN + '  ✓' + RESET, ...a),
  warn:    (...a) => console.warn(YELLOW + '  ⚠' + RESET, ...a),
  error:   (...a) => console.error(RED + '  ✗' + RESET, ...a),
  section: (t)   => console.log(`\n${BOLD}── ${t}${RESET} ${'─'.repeat(Math.max(0, 50 - t.length))}`),
};

// ─── Frontmatter parser (zero deps, handles multiline | blocks) ───────────────
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const fm = {};
  let currentKey      = null;
  let multilineVal    = null;
  let multilineIndent = 0;

  for (const line of match[1].split('\n')) {
    if (multilineVal !== null) {
      if (multilineIndent === 0 && line.trim())
        multilineIndent = line.length - line.trimStart().length;
      if (line.trim() === '' || (multilineIndent > 0 && line.startsWith(' '.repeat(multilineIndent)))) {
        multilineVal += (multilineVal ? '\n' : '') + line.slice(multilineIndent);
        continue;
      }
      fm[currentKey] = multilineVal.trimEnd();
      multilineVal = null; multilineIndent = 0; currentKey = null;
    }

    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key  = line.slice(0, colon).trim();
    const rest = line.slice(colon + 1).trim();
    if (!key) continue;

    if (rest === '|') { currentKey = key; multilineVal = ''; multilineIndent = 0; continue; }

    let val = rest.replace(/^["']|["']$/g, '');
    if (/^\d+$/.test(val)) val = parseInt(val, 10);
    fm[key] = val;
  }
  if (multilineVal !== null && currentKey) fm[currentKey] = multilineVal.trimEnd();
  return fm;
}

// ─── Collect all existing .md files in the repo ───────────────────────────────
function getAllContentFiles() {
  const contentDir = path.join(REPO_ROOT, 'src', 'content');
  const results    = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.md')) results.push(full);
    }
  }

  if (fs.existsSync(contentDir)) walk(contentDir);
  return results;
}

// ─── Per-file validation ──────────────────────────────────────────────────────
function validateFile(filePath, isNew) {
  const errors   = [];
  const warnings = [];
  const relPath  = path.relative(REPO_ROOT, filePath).replace(/\\/g, '/');
  const filename = path.basename(filePath);
  const series   = relPath.split('/')[2] || '';

  // Read file
  let raw;
  try { raw = fs.readFileSync(filePath, 'utf8'); }
  catch (e) { return { errors: [`Cannot read file: ${e.message}`], warnings: [] }; }

  // Must have frontmatter
  if (!raw.match(/^---\r?\n[\s\S]*?\r?\n---/)) {
    errors.push('Missing YAML frontmatter block (file must start with ---)');
    return { errors, warnings };
  }

  const fm = parseFrontmatter(raw);
  if (!fm) {
    errors.push('Failed to parse frontmatter');
    return { errors, warnings };
  }

  // ── Required fields ────────────────────────────────────────────────────────
  if (!fm.title)
    errors.push('Missing required field: title');
  else if (typeof fm.title !== 'string' || fm.title.trim().length === 0)
    errors.push('title must be a non-empty string');

  if (!fm.series)
    errors.push('Missing required field: series');
  else if (!KNOWN_SERIES.includes(fm.series))
    errors.push(`Unknown series "${fm.series}" — must be one of: ${KNOWN_SERIES.join(', ')}`);
  else if (fm.series !== series)
    errors.push(`series field "${fm.series}" does not match directory "${series}"`);

  if (!fm.date)
    errors.push('Missing required field: date');
  else {
    const d = new Date(fm.date);
    if (isNaN(d.getTime()))
      errors.push(`Invalid date: "${fm.date}" — use YYYY-MM-DD format`);
    else {
      const diffDays = (d - Date.now()) / (1000 * 60 * 60 * 24);
      if (diffDays > MAX_FUTURE_DAYS)
        warnings.push(`date is ${Math.round(diffDays)} days in the future — is this intentional?`);
    }
  }

  // ── episode_number ─────────────────────────────────────────────────────────
  if (fm.episode_number === undefined || fm.episode_number === '') {
    // Profiles don't require episode_number
    if (!filename.startsWith('profile-'))
      warnings.push('Missing episode_number — recommended for episodes');
  } else {
    const n = Number(fm.episode_number);
    if (!Number.isInteger(n) || n < 1)
      errors.push(`episode_number must be a positive integer (got: ${fm.episode_number})`);
  }

  // ── description ───────────────────────────────────────────────────────────
  if (!fm.description)
    warnings.push('Missing description — used in Discord embeds and AI generation');
  else if (fm.description.length > MAX_DESCRIPTION_CHARS)
    warnings.push(`description is ${fm.description.length} chars — keep under ${MAX_DESCRIPTION_CHARS} for best results`);

  // ── filename pattern ───────────────────────────────────────────────────────
  const patterns = FILENAME_PATTERNS[series];
  if (patterns) {
    if (!patterns.some(p => p.test(filename)))
      warnings.push(`filename "${filename}" doesn't match expected pattern for ${series} — expected: ${patterns.map(p => p.source).join(' or ')}`);
  }

  // ── Copy-paste guard ───────────────────────────────────────────────────────
  if (isNew) {
    if (fm.devto_id)    errors.push(`devto_id is set on a new file — remove it (copy-paste from another post?)`);
    if (fm.hashnode_id) errors.push(`hashnode_id is set on a new file — remove it (copy-paste from another post?)`);
    if (fm.devto_url)   warnings.push('devto_url is set on a new file — was this copied from another post?');
  }

  return { errors, warnings, fm, series };
}

// ─── Cross-file duplicate checks ─────────────────────────────────────────────
function crossFileChecks(allFiles, changedPaths) {
  const warnings = [];
  const errors   = [];

  // Build index: series → { episode_number → [filenames], title → [filenames] }
  const index = {};
  for (const fp of allFiles) {
    const rel    = path.relative(REPO_ROOT, fp).replace(/\\/g, '/');
    const series = rel.split('/')[2] || '';
    if (!KNOWN_SERIES.includes(series)) continue;

    let raw;
    try { raw = fs.readFileSync(fp, 'utf8'); } catch(_) { continue; }
    const fm = parseFrontmatter(raw);
    if (!fm) continue;

    if (!index[series]) index[series] = { byEpNum: {}, byTitle: {} };

    const epNum = fm.episode_number;
    if (epNum !== undefined && epNum !== '') {
      const n = String(epNum);
      if (!index[series].byEpNum[n]) index[series].byEpNum[n] = [];
      index[series].byEpNum[n].push(path.basename(fp));
    }

    if (fm.title) {
      const t = fm.title.trim().toLowerCase();
      if (!index[series].byTitle[t]) index[series].byTitle[t] = [];
      index[series].byTitle[t].push(path.basename(fp));
    }
  }

  // Check for duplicates
  for (const [series, data] of Object.entries(index)) {
    for (const [epNum, files] of Object.entries(data.byEpNum)) {
      if (files.length > 1)
        errors.push(`${series}: episode_number ${epNum} used by multiple files: ${files.join(', ')}`);
    }
    for (const [title, files] of Object.entries(data.byTitle)) {
      if (files.length > 1)
        warnings.push(`${series}: duplicate title "${title}" in files: ${files.join(', ')}`);
    }

    // Check for gaps in episode sequence
    const epNums = Object.keys(data.byEpNum)
      .map(Number)
      .filter(n => Number.isInteger(n) && n > 0)
      .sort((a, b) => a - b);

    if (epNums.length > 1) {
      const gaps = [];
      for (let i = 1; i < epNums.length; i++)
        for (let g = epNums[i-1] + 1; g < epNums[i]; g++) gaps.push(g);
      if (gaps.length > 0)
        warnings.push(`${series}: episode gaps detected — missing episode${gaps.length > 1 ? 's' : ''}: ${gaps.join(', ')}`);
    }
  }

  return { errors, warnings };
}

// ─── GitHub Actions output helpers ───────────────────────────────────────────
function setOutput(name, value) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    fs.appendFileSync(outputFile, `${name}=${value}\n`);
  } else {
    console.log(`[output] ${name}=${value}`);
  }
}

function writeStepSummary(report) {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryFile) return;

  const lines = ['# Frontmatter Validation Report\n'];

  if (report.totalErrors === 0 && report.totalWarnings === 0) {
    lines.push('## ✅ All checks passed\n');
    lines.push(`Validated ${report.files.length} file(s) — no issues found.\n`);
  } else {
    if (report.totalErrors > 0)
      lines.push(`## ❌ ${report.totalErrors} error(s) — pipeline blocked\n`);
    else
      lines.push('## ✅ No errors — pipeline will proceed\n');

    if (report.totalWarnings > 0)
      lines.push(`> ⚠️ ${report.totalWarnings} warning(s) — review recommended\n`);
  }

  for (const file of report.files) {
    if (file.errors.length === 0 && file.warnings.length === 0) {
      lines.push(`### ✅ \`${file.path}\``);
      lines.push('No issues found.\n');
      continue;
    }

    const icon = file.errors.length > 0 ? '❌' : '⚠️';
    lines.push(`### ${icon} \`${file.path}\``);

    if (file.errors.length > 0) {
      lines.push('**Errors (must fix):**');
      file.errors.forEach(e => lines.push(`- ❌ ${e}`));
    }
    if (file.warnings.length > 0) {
      lines.push('**Warnings (recommended):**');
      file.warnings.forEach(w => lines.push(`- ⚠️ ${w}`));
    }
    lines.push('');
  }

  if (report.crossFileErrors.length > 0 || report.crossFileWarnings.length > 0) {
    lines.push('### Cross-file checks');
    report.crossFileErrors.forEach(e => lines.push(`- ❌ ${e}`));
    report.crossFileWarnings.forEach(w => lines.push(`- ⚠️ ${w}`));
    lines.push('');
  }

  fs.appendFileSync(summaryFile, lines.join('\n'));
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // Determine which files to validate
  const addedRaw   = process.env.ADDED_FILES   || '';
  const modifiedRaw = process.env.MODIFIED_FILES || '';
  const manualFile  = process.env.MANUAL_FILE   || '';
  const gitEvent    = process.env.GIT_EVENT     || 'push';

  let addedFiles    = addedRaw.split(',').map(s => s.trim()).filter(Boolean);
  let modifiedFiles = modifiedRaw.split(',').map(s => s.trim()).filter(Boolean);

  // workflow_dispatch with explicit file
  if (gitEvent === 'workflow_dispatch' && manualFile) {
    addedFiles    = [manualFile];
    modifiedFiles = [];
  }

  const allTouched = [...new Set([...addedFiles, ...modifiedFiles])];
  const allContent = getAllContentFiles();

  log.section('Frontmatter Validation');
  log.info(`Event:     ${gitEvent}`);
  log.info(`New files: ${addedFiles.length > 0 ? addedFiles.join(', ') : '(none)'}`);
  log.info(`Modified:  ${modifiedFiles.length > 0 ? modifiedFiles.join(', ') : '(none)'}`);
  log.info(`All .md:   ${allContent.length} files in repo`);

  if (allTouched.length === 0) {
    log.ok('No .md files touched — nothing to validate');
    setOutput('passed', 'true');
    setOutput('has_new_files', 'false');
    setOutput('valid_new_files', '');
    return;
  }

  // ── Per-file validation ───────────────────────────────────────────────────
  log.section('Per-file checks');
  const fileReports = [];

  for (const relPath of allTouched) {
    const absPath = path.resolve(REPO_ROOT, relPath);
    const isNew   = addedFiles.includes(relPath);

    log.info(`Checking: ${relPath} ${isNew ? '(new)' : '(modified)'}`);

    if (!fs.existsSync(absPath)) {
      log.warn(`  File not found on disk — may have been deleted`);
      fileReports.push({ path: relPath, errors: [], warnings: ['File not found — may be a deletion'], skipped: true });
      continue;
    }

    const result = validateFile(absPath, isNew);
    fileReports.push({ path: relPath, isNew, ...result });

    if (result.errors.length > 0) {
      result.errors.forEach(e => log.error(`  ${e}`));
    }
    if (result.warnings.length > 0) {
      result.warnings.forEach(w => log.warn(`  ${w}`));
    }
    if (result.errors.length === 0 && result.warnings.length === 0) {
      log.ok(`  All checks passed`);
    }
  }

  // ── Cross-file checks ─────────────────────────────────────────────────────
  log.section('Cross-file checks');
  const { errors: crossErrors, warnings: crossWarnings } = crossFileChecks(allContent, allTouched);

  if (crossErrors.length === 0 && crossWarnings.length === 0) {
    log.ok('No duplicates or gaps detected');
  } else {
    crossErrors.forEach(e => log.error(`  ${e}`));
    crossWarnings.forEach(w => log.warn(`  ${w}`));
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const totalErrors   = fileReports.reduce((n, r) => n + r.errors.length, 0) + crossErrors.length;
  const totalWarnings = fileReports.reduce((n, r) => n + r.warnings.length, 0) + crossWarnings.length;

  const report = {
    files:            fileReports,
    crossFileErrors:  crossErrors,
    crossFileWarnings: crossWarnings,
    totalErrors,
    totalWarnings,
  };

  log.section('Result');
  if (totalErrors === 0) {
    log.ok(`Validation passed — ${totalWarnings} warning(s)`);
  } else {
    log.error(`Validation FAILED — ${totalErrors} error(s), ${totalWarnings} warning(s)`);
  }

  // Write GitHub Actions step summary
  writeStepSummary(report);

  // Set outputs for downstream jobs
  const validNewFiles = fileReports
    .filter(r => r.isNew && r.errors.length === 0)
    .map(r => r.path)
    .join(',');

  setOutput('passed',          String(totalErrors === 0));
  setOutput('has_new_files',   String(addedFiles.length > 0));
  setOutput('valid_new_files', validNewFiles);

  // Exit code — errors block the pipeline, warnings do not
  if (totalErrors > 0) {
    console.error(`\n${RED}${BOLD}Pipeline blocked — fix the errors above before publishing.${RESET}\n`);
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
