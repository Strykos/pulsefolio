import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "../../../packages/design-tokens");
const dest = join(here, "../vendor/design-tokens");

if (!existsSync(src)) {
  if (existsSync(join(dest, "base.json"))) {
    console.log("Using committed design tokens in apps/web/vendor/design-tokens");
    process.exit(0);
  }
  throw new Error("Design tokens missing: run from monorepo root or commit vendor/design-tokens");
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(join(dest, "themes"), { recursive: true });
cpSync(join(src, "base.json"), join(dest, "base.json"));
cpSync(join(src, "themes"), join(dest, "themes"), { recursive: true });

console.log("Copied design tokens to apps/web/vendor/design-tokens");
