/**
 * Script: setup-structure.ts
 * Purpose: Automate creation of the recommended file structure for TheLadiesOracleApp.
 * Usage: npx ts-node tools/setup-structure.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const folders = [
  'docs',
  'scripts',
  'config',
  'assets/images',
  'assets/fonts',
  'assets/icons',
  'src/common/hooks',
  'src/common/utils',
  'src/components/shared',
  'src/navigation',
  'src/services',
  'src/web/components',
  'src/web/pages',
  'src/web/styles',
  'src/mobile/components',
  'src/mobile/screens',
  'src/mobile/styles',
  'src/theme',
  'src/localization',
  'tests/unit',
  'tests/integration',
  'tests/e2e',
  // Added folders:
  'ios',
  'android',
  'public',
];

// Helper to create folders recursively
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created: ${dir}`);
  }
}

// Main
function main() {
  for (const folder of folders) {
    ensureDir(path.join(process.cwd(), folder));
  }

  // Optionally, add sample README.md files to empty dirs for git tracking
  folders.forEach((dir) => {
    const fullPath = path.join(process.cwd(), dir, 'README.md');
    if (!fs.existsSync(fullPath)) {
      fs.writeFileSync(
        fullPath,
        `# ${dir}\n\nThis directory is part of the project structure.`
      );
    }
  });

  console.log('\n✅ Project structure setup complete!');
}

main();