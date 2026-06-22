import { copyFile, mkdir, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const outputDir = join(root, "public");
const staticFiles = ["index.html", "app.js", "styles.css", "config.js"];

for (const file of ["app.js", "server.mjs", "build.mjs"]) {
  execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

await Promise.all(
  staticFiles.map((file) => copyFile(join(root, file), join(outputDir, file)))
);

console.log(`Built ${staticFiles.length} static files into public/`);
