import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_REPO_ROOT = path.resolve(__dirname, '../..');

export class TourRecorder {
  constructor(options = {}) {
    this.enabled = options.enabled !== undefined ? !!options.enabled : true;
    this.repoRoot = path.resolve(options.repoRoot || DEFAULT_REPO_ROOT);
    this.tourDir = options.tourDir ? path.resolve(options.tourDir) : path.join(this.repoRoot, 'docs/tour');
    this.screenshotsDir = options.screenshotsDir
      ? path.resolve(options.screenshotsDir)
      : path.join(this.tourDir, 'screenshots');
    this.historyDir = options.historyDir ? path.resolve(options.historyDir) : path.join(this.tourDir, 'history');
    this.screenshots = [];
    this.targetUrl = options.targetUrl || 'https://counters.hinolugi.com';
    this.testUser = options.testUser || 'tester@hinolugi.com';
    this.targetVersion = options.targetVersion || '1.0.0';
    this.nowIso = options.nowIso || new Date().toISOString();
    this.todayStamp = this.nowIso.slice(0, 10);
    this.archiveDirName = options.archiveDirName || `${this.todayStamp}-v${this.targetVersion}`;
    this.archiveDir = options.archiveDir
      ? path.resolve(options.archiveDir)
      : path.join(this.historyDir, this.archiveDirName);
    this.title = options.title || 'HiNoLuGi - Visual Tour & Interactive User Tutorial';
    this.description =
      options.description || 'This document serves as an end-to-end visual walkthrough and mini-tutorial.';
    this.minByteSize = options.minByteSize !== undefined ? options.minByteSize : 5000;
    this.allowedDuplicates = options.allowedDuplicates || [];
    this.isLegitDuplicate = typeof options.isLegitDuplicate === 'function' ? options.isLegitDuplicate : null;
  }

  async capture(page, name, caption, meta = {}) {
    if (!this.enabled) {
      return null;
    }

    const cleanName = name.replace(/\.png$/i, '');
    const filename = `${cleanName}.png`;
    const fullPath = path.join(this.screenshotsDir, filename);
    const archivePath = path.join(this.archiveDir, filename);

    fs.mkdirSync(this.screenshotsDir, { recursive: true });
    fs.mkdirSync(this.archiveDir, { recursive: true });

    const screenshotOpts = { fullPage: false, ...(meta.screenshotOptions || {}) };
    const buffer = await page.screenshot(screenshotOpts);

    fs.writeFileSync(fullPath, buffer);
    fs.writeFileSync(archivePath, buffer);

    const record = {
      name: cleanName,
      filename,
      fullPath,
      archivePath,
      relativePath: `screenshots/${filename}`,
      caption,
      size: buffer.length,
      ...meta,
    };

    this.screenshots.push(record);
    return record;
  }

  checkLegitDuplicate(prev, current) {
    if (this.isLegitDuplicate) {
      return !!this.isLegitDuplicate(prev, current);
    }

    const prevName = (prev.name || prev.filename || '').replace(/\.png$/i, '');
    const currName = (current.name || current.filename || '').replace(/\.png$/i, '');

    for (const item of this.allowedDuplicates) {
      if (Array.isArray(item) && item.length === 2) {
        const [a, b] = item.map((x) => String(x).replace(/\.png$/i, ''));
        if ((a === prevName && b === currName) || (a === currName && b === prevName)) {
          return true;
        }
      }
    }

    const isKnownDuplicate =
      (prevName === '03-empty-dashboard' &&
        (currName === '14-dashboard-after-delete' || currName === '18-cleanup-completed')) ||
      (prevName === '14-dashboard-after-delete' && currName === '18-cleanup-completed');

    return isKnownDuplicate;
  }

  validateIntegrity() {
    if (!this.enabled || this.screenshots.length === 0) {
      return [];
    }

    const stepHashes = new Map();

    for (let i = 0; i < this.screenshots.length; i++) {
      const s = this.screenshots[i];
      const buf = fs.readFileSync(s.fullPath);

      if (buf.length < this.minByteSize) {
        throw new Error(`Screenshot ${s.filename} is suspiciously small (${buf.length} bytes), possible blank frame!`);
      }

      const hash = crypto.createHash('sha256').update(buf).digest('hex');
      s.sha256 = hash;
      s.size = buf.length;

      if (stepHashes.has(hash)) {
        const prev = stepHashes.get(hash);
        const isLegit = this.checkLegitDuplicate(prev, s);
        if (!isLegit) {
          throw new Error(
            `Visual regression detected: Screenshot #${i + 1} (${s.filename}) is byte-for-byte identical to #${prev.idx + 1} (${prev.filename || prev.name}) - SHA256: ${hash}.`,
          );
        }
      }

      stepHashes.set(hash, { idx: i, name: s.name, filename: s.filename, screenshot: s });
    }

    return this.screenshots;
  }

  generateSummaryTable() {
    let table = '| # | Step Name | File | Size | SHA-256 Checksum |\n';
    table += '|---|-----------|------|------|------------------|\n';

    this.screenshots.forEach((s, idx) => {
      const shaPrefix = s.sha256 ? `${s.sha256.substring(0, 16)}...` : 'N/A';
      const sizeKb = s.size !== undefined ? (s.size / 1024).toFixed(1) : '0.0';
      table += `| ${idx + 1} | ${s.caption} | \`${s.filename}\` | ${sizeKb} KB | \`${shaPrefix}\` |\n`;
    });

    return table;
  }

  generateWalkthroughMarkdown() {
    let reportMd = `# ${this.title}\n\n`;
    reportMd += `**Target Environment**: \`${this.targetUrl}\`  \n`;
    reportMd += `**Version**: \`v${this.targetVersion}\`  \n`;
    reportMd += `**Executed User**: \`${this.testUser}\`  \n`;
    reportMd += `**Date**: \`${this.nowIso}\`  \n\n`;

    if (this.description) {
      reportMd += `${this.description}\n\n`;
    }

    reportMd += `## Verification & Integrity Summary\n\n`;
    reportMd += this.generateSummaryTable();
    reportMd += `\n`;

    reportMd += `## Visual Tour & Tutorial Walkthrough\n\n`;

    this.screenshots.forEach((s) => {
      reportMd += `### ${s.caption}\n\n`;
      if (s.action) {
        reportMd += `* **Action / Navigation**: ${s.action}\n`;
      }
      if (s.visualResult) {
        reportMd += `* **Visual Feedback**: ${s.visualResult}\n\n`;
      }
      reportMd += `![${s.caption}](${s.relativePath})\n\n`;
      reportMd += `---\n\n`;
    });

    return reportMd;
  }

  generateReports() {
    if (!this.enabled || this.screenshots.length === 0) {
      return null;
    }

    for (const s of this.screenshots) {
      if (!s.sha256 && fs.existsSync(s.fullPath)) {
        const buf = fs.readFileSync(s.fullPath);
        s.sha256 = crypto.createHash('sha256').update(buf).digest('hex');
        s.size = buf.length;
      }
    }

    fs.mkdirSync(this.tourDir, { recursive: true });
    fs.mkdirSync(this.archiveDir, { recursive: true });
    fs.mkdirSync(this.historyDir, { recursive: true });

    const reportMd = this.generateWalkthroughMarkdown();
    const canonicalReportPath = path.join(this.tourDir, 'ui-tour-report.md');
    const historicalReportPath = path.join(this.archiveDir, 'ui-tour-report.md');

    fs.writeFileSync(canonicalReportPath, reportMd, 'utf8');
    fs.writeFileSync(historicalReportPath, reportMd, 'utf8');

    let historyIndexMd = `# Visual Tour History Archive\n\n`;
    historyIndexMd += `This directory preserves historical visual snapshots and UI tour reports across past versions.\n\n`;
    historyIndexMd += `## Available Tours\n\n`;

    const historyDirs = fs.existsSync(this.historyDir)
      ? fs
          .readdirSync(this.historyDir, { withFileTypes: true })
          .filter((d) => d.isDirectory() && fs.existsSync(path.join(this.historyDir, d.name, 'ui-tour-report.md')))
          .map((d) => d.name)
      : [];

    for (const hd of historyDirs.sort().reverse()) {
      historyIndexMd += `- [${hd}](./${hd}/ui-tour-report.md)\n`;
    }

    const historyIndexPath = path.join(this.historyDir, 'index.md');
    fs.writeFileSync(historyIndexPath, historyIndexMd, 'utf8');

    return {
      canonicalReportPath,
      historicalReportPath,
      historyIndexPath,
      reportMd,
      historyIndexMd,
    };
  }
}
