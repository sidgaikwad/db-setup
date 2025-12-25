#!/usr/bin/env node

import { handleDatabaseSetup } from "./database";
import chalk from "chalk";

async function main() {
  try {
    console.log(chalk.bold.cyan("\n🚀 Database Setup CLI\n"));

    const databaseUrl = await handleDatabaseSetup();

    if (databaseUrl) {
      console.log(chalk.green("\n✅ Setup completed successfully!"));
      console.log(chalk.gray("\nNext steps:"));
      console.log(chalk.gray("  1. Verify your .env file"));
      console.log(chalk.gray("  2. Run database migrations"));
      console.log(chalk.gray("  3. Start your application\n"));
    }
  } catch (error) {
    console.error(chalk.red("\n❌ Setup failed:"), error);
    process.exit(1);
  }
}

main();
