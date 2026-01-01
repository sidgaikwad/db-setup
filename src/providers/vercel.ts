import { spawnSync } from "child_process";
import { select, input, confirm } from "@inquirer/prompts";
import chalk from "chalk";

/**
 * Check if Vercel CLI is installed
 */
const ensureVercelCli = (): void => {
  const check = spawnSync("vercel", ["--version"], {
    encoding: "utf-8",
    shell: true,
    stdio: "pipe",
  });

  if (check.status !== 0) {
    console.log(chalk.yellowBright("Vercel CLI not found. Installing..."));
    const install = spawnSync("npm", ["install", "-g", "vercel"], {
      shell: true,
      stdio: "inherit",
    });
    if (install.status !== 0) {
      console.log(chalk.red("\n❌ Failed to install Vercel CLI."));
      process.exit(1);
    }
  }
};

/**
 * Check authentication with Vercel
 */
const checkVercelAuth = (): boolean => {
  console.log(chalk.blueBright("\nChecking Vercel authentication..."));

  const authCheck = spawnSync("vercel", ["whoami"], {
    encoding: "utf-8",
    shell: true,
    stdio: "pipe",
  });

  if (authCheck.status !== 0) {
    console.log(chalk.yellowBright("Not logged in to Vercel."));
    console.log(chalk.blueBright("\nAuthenticating with Vercel..."));

    const loginResult = spawnSync("vercel", ["login"], {
      stdio: "inherit",
      shell: true,
    });

    if (loginResult.status !== 0) {
      console.log(chalk.red("\n❌ Authentication failed."));
      process.exit(1);
    }

    console.log(
      chalk.greenBright("\n✅ Successfully authenticated with Vercel!")
    );
    return true;
  }

  console.log(chalk.greenBright("✅ Already logged in to Vercel."));
  return true;
};

/**
 * Get available Vercel regions
 */
const getVercelRegions = (): Array<{ name: string; value: string }> => {
  return [
    { name: "🇺🇸 Washington, D.C. (US East)", value: "iad1" },
    { name: "🇺🇸 San Francisco (US West)", value: "sfo1" },
    { name: "🇪🇺 Frankfurt (Europe)", value: "fra1" },
    { name: "🇸🇬 Singapore (Asia)", value: "sin1" },
  ];
};

/**
 * Create Vercel Postgres database
 */
const createVercelDatabase = async (
  name: string,
  region: string
): Promise<string> => {
  console.log(
    chalk.blueBright(`\nCreating Vercel Postgres database '${name}'...`)
  );
  console.log(
    chalk.yellow("Note: You may be prompted to select a Vercel project.\n")
  );

  const createResult = spawnSync(
    "vercel",
    ["postgres", "create", name, "--region", region],
    {
      encoding: "utf-8",
      shell: true,
      stdio: "inherit",
    }
  );

  if (createResult.status !== 0) {
    console.error(chalk.red("\n❌ Failed to create Vercel Postgres database."));
    process.exit(1);
  }

  console.log(
    chalk.greenBright(`\n✅ Database '${name}' created successfully!`)
  );

  // Get connection string
  console.log(chalk.blueBright("\nFetching connection string..."));

  const envResult = spawnSync("vercel", ["env", "ls", "--json"], {
    encoding: "utf-8",
    shell: true,
    stdio: "pipe",
  });

  if (envResult.status !== 0) {
    console.error(chalk.red("❌ Failed to fetch environment variables."));
    console.log(chalk.yellow("\nPlease get your connection string from:"));
    console.log(chalk.cyan("https://vercel.com/dashboard/stores"));
    process.exit(1);
  }

  try {
    const envVars = JSON.parse(envResult.stdout);
    const postgresUrl = envVars.find(
      (v: any) =>
        v.key === "POSTGRES_URL" ||
        (v.key.includes("POSTGRES") && v.key.includes("URL"))
    );

    if (!postgresUrl) {
      console.log(
        chalk.yellow("\n⚠️  Could not automatically fetch connection string.")
      );
      console.log(chalk.yellow("Please get your POSTGRES_URL from:"));
      console.log(chalk.cyan("https://vercel.com/dashboard/stores"));

      const manualUrl = await input({
        message: chalk.cyan("Enter your POSTGRES_URL:"),
        validate: (inputValue: string) => {
          if (!inputValue || !inputValue.startsWith("postgres")) {
            return "Invalid PostgreSQL connection string";
          }
          return true;
        },
      });

      return manualUrl;
    }

    return postgresUrl.value;
  } catch (error) {
    console.error(chalk.red("❌ Failed to parse environment variables."));
    console.log(chalk.yellow("\nPlease get your connection string from:"));
    console.log(chalk.cyan("https://vercel.com/dashboard/stores"));
    process.exit(1);
  }
};

/**
 * Main function to set up Vercel Postgres
 */
export const setupVercel = async (): Promise<string> => {
  console.log(
    chalk.magentaBright(
      "\n================ Vercel Postgres Setup ================\n"
    )
  );

  ensureVercelCli();
  checkVercelAuth();

  const regions = getVercelRegions();

  const selectedRegion = await select({
    message: chalk.cyan("Choose your Vercel Postgres region:"),
    default: "iad1",
    choices: regions,
  });

  const dbName = await input({
    message: chalk.cyan("Enter a name for your database:"),
    default: "zerostarter-db",
    validate: (inputValue: string) => {
      if (!inputValue || inputValue.trim().length === 0) {
        return "Database name cannot be empty";
      }
      if (!/^[a-z0-9-_]+$/.test(inputValue)) {
        return "Database name must contain only lowercase letters, numbers, hyphens, and underscores";
      }
      return true;
    },
  });

  const databaseUrl = await createVercelDatabase(dbName, selectedRegion);

  console.log(chalk.greenBright(`\n✅ Vercel Postgres created successfully!`));
  console.log(chalk.greenBright(`\nDATABASE_URL:\n${databaseUrl}\n`));
  console.log(chalk.yellow("--------------------------------"));

  return databaseUrl;
};
