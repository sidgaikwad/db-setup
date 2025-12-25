#!/usr/bin/env node

// postinstall.js - Show helpful message after installation

import chalk from "chalk";

console.log(
  "\n" +
    chalk.bold.cyan(
      "╔════════════════════════════════════════════════════════════╗"
    )
);
console.log(
  chalk.bold.cyan("║") +
    "  " +
    chalk.bold.white("🗄️  Database Setup CLI installed successfully!") +
    "     " +
    chalk.bold.cyan("║")
);
console.log(
  chalk.bold.cyan(
    "╚════════════════════════════════════════════════════════════╝"
  ) + "\n"
);

console.log(chalk.bold.green("✨ Quick Start:\n"));

console.log(chalk.cyan("  Run the setup wizard:"));
console.log(chalk.white("    $ ") + chalk.yellow("bunx @sidgaikwad/db-setup"));
console.log(chalk.gray("    or"));
console.log(chalk.white("    $ ") + chalk.yellow("npx @sidgaikwad/db-setup"));
console.log(chalk.gray("    or"));
console.log(chalk.white("    $ ") + chalk.yellow("bun run create-db-setup"));
console.log(chalk.gray("    or"));
console.log(chalk.white("    $ ") + chalk.yellow("npm run create-db-setup\n"));

console.log(chalk.cyan("  Add to your package.json scripts:"));
console.log(chalk.white("    {"));
console.log(chalk.white('      "scripts": {'));
console.log(
  chalk.white("        ") +
    chalk.yellow('"db:setup"') +
    chalk.white(": ") +
    chalk.green('"create-db-setup"')
);
console.log(chalk.white("      }"));
console.log(chalk.white("    }\n"));

console.log(chalk.cyan("  Then run:"));
console.log(chalk.white("    $ ") + chalk.yellow("bun run db:setup\n"));

console.log(chalk.bold.blue("📚 Documentation:"));
console.log(chalk.white("   https://github.com/sidgaikwad/db-setup#readme\n"));

console.log(
  chalk.gray("────────────────────────────────────────────────────────────\n")
);
