"use strict";
/**
 * Script: setup-structure.ts
 * Purpose: Automate creation of the recommended file structure for TheLadiesOracleApp.
 * Usage: npx ts-node tools/setup-structure.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var folders = [
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
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log("Created: ".concat(dir));
    }
}
// Main
function main() {
    for (var _i = 0, folders_1 = folders; _i < folders_1.length; _i++) {
        var folder = folders_1[_i];
        ensureDir(path.join(process.cwd(), folder));
    }
    // Optionally, add sample README.md files to empty dirs for git tracking
    folders.forEach(function (dir) {
        var fullPath = path.join(process.cwd(), dir, 'README.md');
        if (!fs.existsSync(fullPath)) {
            fs.writeFileSync(fullPath, "# ".concat(dir, "\n\nThis directory is part of the project structure."));
        }
    });
    console.log('\n✅ Project structure setup complete!');
}
main();
