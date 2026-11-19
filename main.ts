// Leonida Legend — the gta6-trophy-guide-01 entry program (Node 22, standard library only).
//
// The guide itself is plain static files in app/ (index.html, app.js, style.css and
// app/data/trophies.json), so a browser opens it with the network off. This program
// is the hand-in: it copies app/ and screenshots/ from this repository into the
// output directory and writes output/dossier.json with the vendored make.fun
// library, the summary the judge reads. vendor/makefun-frontend.ts is the kit's
// copy and must stay byte for byte as shipped.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy the guide first, then the screenshots beside it.
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The gate's own caps, as the kit's scorer states them: at most 4 screenshots of
// at most 256 KiB, app/ at most 993 files and directories and 48 MiB, and the
// dossier text at most 160 KiB. The dossier is byte for byte what buildDossier
// writes from the copied files, so the scorer's rebuild matches this one.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
