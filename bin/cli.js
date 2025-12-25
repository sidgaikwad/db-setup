#!/usr/bin/env node

import fs from "fs";
import path from "path";
import os from "os";

const hintFile = path.join(os.homedir(), ".db-setup-hint");

if (!fs.existsSync(hintFile)) {
  console.log(`
✨ @sidgaikwad/db-setup installed successfully!

👉 Run using:
   • bun run db-setup
   • npx db-setup
`);
  fs.writeFileSync(hintFile, "shown");
}

import("../dist/index.js");
