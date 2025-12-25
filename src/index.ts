#!/usr/bin/env node

import { handleDatabaseSetup } from "./database";
import { initializeEnvFile } from "./env";
import chalk from "chalk";

async function main() {
  try {
    console.log(chalk.bold.cyan("\n🗄️  Database Setup CLI\n"));
    console.log(chalk.gray("Configure your PostgreSQL database with ease!\n"));

    // Initialize .env from .env.example if it exists
    initializeEnvFile();

    // Handle database setup
    const databaseUrl = await handleDatabaseSetup();

    if (databaseUrl) {
      console.log(chalk.green("\n🎉 Setup completed successfully!\n"));
      console.log(chalk.cyan("Next steps:"));
      console.log(chalk.gray("  1. ✓ Database connection configured"));
      console.log(chalk.gray("  2. → Review your .env file"));
      console.log(chalk.gray("  3. → Run database migrations (if applicable)"));
      console.log(chalk.gray("  4. → Start your application"));
      console.log(chalk.gray("  5. → Start building! 🚀\n"));
    } else {
      console.log(
        chalk.yellow("\n⏭️  Setup skipped. You can run this again anytime.\n")
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red("\n❌ Setup failed:"), error.message);
    } else {
      console.error(chalk.red("\n❌ Setup failed:"), error);
    }
    console.log(
      chalk.gray(
        "\nTip: Run the command again or check the error message above.\n"
      )
    );
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log(chalk.yellow("\n\n⚠️  Setup cancelled by user"));
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log(chalk.yellow("\n\n⚠️  Setup cancelled"));
  process.exit(0);
});

main();
