import { select, input } from "@inquirer/prompts";
import chalk from "chalk";
import { setupNeon } from "./providers/neon";
import { setupSupabase } from "./providers/supabase";
import { setupRailway } from "./providers/railway-pg";
import { setupLocalDocker } from "./providers/local-docker";
import { setupEnvironment, validateConnectionString } from "./env";
import { setupRender } from "./providers/render";
import { setupVercel } from "./providers/vercel";

export async function handleDatabaseSetup(): Promise<string> {
  console.log(
    chalk.magentaBright("\n================ Database Setup ================\n")
  );

  const provider = await select({
    message: "Choose your PostgreSQL provider:",
    default: "neon",
    choices: [
      { name: "Neon (Serverless PostgreSQL)", value: "neon" },
      {
        name: "Supabase (Open Source Firebase Alternative)",
        value: "supabase",
      },
      { name: "Railway (Platform as a Service)", value: "railway" },
      { name: "Render (Cloud Hosting Platform)", value: "render" },
      { name: "Vercel Postgres (Serverless PostgreSQL)", value: "vercel" },
      { name: "Local PostgreSQL (Docker)", value: "local" },
      { name: "I already have a DATABASE_URL", value: "manual" },
      { name: "I'll configure later", value: "later" },
    ],
  });

  let databaseUrl: string | null = null;

  switch (provider) {
    case "neon":
      databaseUrl = await setupNeon();
      break;

    case "supabase":
      databaseUrl = await setupSupabase();
      break;

    case "railway":
      databaseUrl = await setupRailway();
      break;

    case "render":
      databaseUrl = await setupRender();
      break;

    case "vercel":
      databaseUrl = await setupVercel();
      break;

    case "local":
      databaseUrl = await setupLocalDocker();
      break;

    case "manual":
      databaseUrl = await input({
        message: chalk.cyan("Enter your PostgreSQL connection string:"),
        validate: (inputValue: string) => {
          if (!inputValue || inputValue.trim().length === 0) {
            return "Connection string cannot be empty";
          }

          if (!validateConnectionString(inputValue)) {
            return "Invalid PostgreSQL connection string format. Expected: postgresql://...";
          }

          return true;
        },
      });
      break;

    case "later":
      console.log(chalk.gray("\n⏭️  Skipping database setup."));
      console.log(chalk.gray("You can configure your database later by:"));
      console.log(
        chalk.gray("  1. Creating a database with your preferred provider")
      );
      console.log(
        chalk.gray("  2. Adding the connection string to your .env file")
      );
      console.log(chalk.gray("  3. Running your database migrations\n"));
      return "";

    default:
      console.log(chalk.red(`\n❌ Unknown provider: ${provider}`));
      process.exit(1);
  }

  if (!databaseUrl) {
    console.error(chalk.red("\n❌ Failed to obtain database URL"));
    process.exit(1);
  }

  // Setup environment with custom path and variable name
  await setupEnvironment(databaseUrl);

  return databaseUrl;
}
