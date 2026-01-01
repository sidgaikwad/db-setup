import { spawnSync } from "child_process";
import { select, input } from "@inquirer/prompts";
import chalk from "chalk";

/**
 * Check if Render CLI is installed
 */
const ensureRenderCli = (): void => {
  const check = spawnSync("render", ["--version"], {
    encoding: "utf-8",
    shell: true,
    stdio: "pipe",
  });

  if (check.status !== 0) {
    console.log(chalk.yellowBright("Render CLI not found. Installing..."));
    console.log(chalk.cyan("\nPlease install Render CLI manually:"));
    console.log(chalk.white("  npm install -g @render-cli/cli"));
    console.log(chalk.white("  or"));
    console.log(chalk.white("  brew install renderinc/tap/render"));
    console.log(chalk.yellow("\nAfter installing, run this setup again."));
    process.exit(1);
  }
};

/**
 * Check authentication with Render
 */
const checkRenderAuth = (): boolean => {
  console.log(chalk.blueBright("\nChecking Render authentication..."));

  const authCheck = spawnSync("render", ["whoami"], {
    encoding: "utf-8",
    shell: true,
    stdio: "pipe",
  });

  if (authCheck.status !== 0) {
    console.log(chalk.yellowBright("Not logged in to Render."));
    console.log(chalk.blueBright("\nTo authenticate with Render:"));
    console.log(
      chalk.cyan(
        "You'll need to create an API key at: https://dashboard.render.com/u/settings#api-keys\n"
      )
    );

    const loginResult = spawnSync("render", ["login"], {
      stdio: "inherit",
      shell: true,
    });

    if (loginResult.status !== 0) {
      console.log(chalk.red("\n❌ Authentication failed."));
      process.exit(1);
    }

    console.log(
      chalk.greenBright("\n✅ Successfully authenticated with Render!")
    );
    return true;
  }

  console.log(chalk.greenBright("✅ Already logged in to Render."));
  return true;
};

/**
 * Get available Render regions
 */
const getRenderRegions = (): Array<{ name: string; value: string }> => {
  return [
    { name: "🇺🇸 Oregon (US West)", value: "oregon" },
    { name: "🇺🇸 Ohio (US East)", value: "ohio" },
    { name: "🇪🇺 Frankfurt (Europe)", value: "frankfurt" },
    { name: "🇸🇬 Singapore (Asia)", value: "singapore" },
  ];
};

/**
 * Create Render PostgreSQL database
 */
const createRenderDatabase = async (
  name: string,
  region: string
): Promise<{
  host: string;
  database: string;
  user: string;
  password: string;
  port: number;
}> => {
  console.log(
    chalk.blueBright(`\nCreating Render PostgreSQL database '${name}'...`)
  );

  // Create database using Render CLI
  const createResult = spawnSync(
    "render",
    [
      "services",
      "create",
      "postgres",
      "--name",
      name,
      "--region",
      region,
      "--plan",
      "free", // or "starter" for paid plan
      "--json",
    ],
    {
      encoding: "utf-8",
      shell: true,
      stdio: "pipe",
    }
  );

  if (createResult.status !== 0) {
    console.error(chalk.red("\n❌ Failed to create Render database."));
    console.error(chalk.red(createResult.stderr));
    process.exit(1);
  }

  try {
    const result = JSON.parse(createResult.stdout);

    console.log(
      chalk.blueBright(
        "\nWaiting for database to provision (this may take 2-3 minutes)..."
      )
    );

    // Wait for database to be ready
    let ready = false;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes

    while (!ready && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const statusResult = spawnSync(
        "render",
        ["services", "get", result.id, "--json"],
        {
          encoding: "utf-8",
          shell: true,
          stdio: "pipe",
        }
      );

      if (statusResult.status === 0) {
        const status = JSON.parse(statusResult.stdout);
        if (status.status === "available") {
          ready = true;
        }
      }

      attempts++;
      if (attempts % 6 === 0) {
        console.log(chalk.dim(`Still waiting... (${attempts * 5}s elapsed)`));
      }
    }

    if (!ready) {
      console.error(chalk.red("\n❌ Database took too long to provision."));
      console.log(
        chalk.yellow("Please check your Render dashboard for status.")
      );
      process.exit(1);
    }

    // Get connection details
    const detailsResult = spawnSync(
      "render",
      ["services", "get", result.id, "--json"],
      {
        encoding: "utf-8",
        shell: true,
        stdio: "pipe",
      }
    );

    if (detailsResult.status !== 0) {
      console.error(chalk.red("❌ Failed to get database details."));
      process.exit(1);
    }

    const details = JSON.parse(detailsResult.stdout);

    return {
      host: details.postgres?.host || details.host,
      database: details.postgres?.database || name,
      user: details.postgres?.user || "postgres",
      password: details.postgres?.password || "",
      port: details.postgres?.port || 5432,
    };
  } catch (error) {
    console.error(chalk.red("❌ Failed to parse database response."));
    console.error(chalk.yellow("Raw output:"), createResult.stdout);
    process.exit(1);
  }
};

/**
 * Main function to set up Render PostgreSQL
 */
export const setupRender = async (): Promise<string> => {
  console.log(
    chalk.magentaBright(
      "\n================ Render PostgreSQL Setup ================\n"
    )
  );

  ensureRenderCli();
  checkRenderAuth();

  const regions = getRenderRegions();

  const selectedRegion = await select({
    message: chalk.cyan("Choose your Render region:"),
    default: "oregon",
    choices: regions,
  });

  const dbName = await input({
    message: chalk.cyan("Enter a name for your database:"),
    default: "zerostarter-db",
    validate: (inputValue: string) => {
      if (!inputValue || inputValue.trim().length === 0) {
        return "Database name cannot be empty";
      }
      if (!/^[a-z0-9-]+$/.test(inputValue)) {
        return "Database name must contain only lowercase letters, numbers, and hyphens";
      }
      return true;
    },
  });

  const dbConfig = await createRenderDatabase(dbName, selectedRegion);

  const databaseUrl = `postgresql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}?sslmode=require`;

  console.log(
    chalk.greenBright(`\n✅ Render PostgreSQL created successfully!`)
  );
  console.log(chalk.greenBright(`\nDATABASE_URL:\n${databaseUrl}\n`));
  console.log(chalk.yellow("--------------------------------"));

  return databaseUrl;
};
