import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const nextDir = join(root, ".next");
const standaloneDir = join(nextDir, "standalone");

if (!existsSync(standaloneDir)) {
  console.warn(
    "Skipping standalone asset copy: .next/standalone was not generated."
  );
  process.exit(0);
}

const standaloneNextDir = join(standaloneDir, ".next");
mkdirSync(standaloneNextDir, { recursive: true });

const copies = [
  {
    from: join(nextDir, "static"),
    to: join(standaloneNextDir, "static"),
  },
  {
    from: join(root, "public"),
    to: join(standaloneDir, "public"),
  },
];

for (const { from, to } of copies) {
  if (!existsSync(from)) continue;

  rmSync(to, { recursive: true, force: true });
  cpSync(from, to, { recursive: true });
}

console.log("Standalone assets copied into .next/standalone.");
