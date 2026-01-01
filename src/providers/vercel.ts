import { spawnSync } from "child_process";
import { input, confirm } from "@inquirer/prompts";
import chalk from "chalk";

/**
 * Open URL in default browser
 */
const openBrowser = (url: string): void => {
  const platform = process.platform;
  let command: string;

  if (platform === "darwin") {
    command = "open";
  } else if (platform === "win32") {
    command = "start";
  } else {
    command = "xdg-open";
  }

  spawnSync(command, [url], { shell: true, stdio: "ignore" });
};

/**
 * Check if Vercel CLI is installed and offer to install it
 */
const ensureVercelCli = async (): Promise<boolean> => {
  const check = spawnSync("vercel", ["--version"], {
    encoding: "utf-8",
    shell: true,
    stdio: "pipe",
  });

  if (check.status !== 0) {
    console.log(chalk.yellowBright("\n⚠️  Vercel CLI is not installed."));

    const shouldInstall = await confirm({
      message: "Would you like to install Vercel CLI automatically?",
      default: true,
    });

    if (!shouldInstall) {
      return false;
    }

    console.log(chalk.blueBright("\nInstalling Vercel CLI..."));
    const install = spawnSync("npm", ["install", "-g", "vercel"], {
      shell: true,
      stdio: "inherit",
    });

    if (install.status !== 0) {
      console.log(
        chalk.red("\n❌ Failed to install Vercel CLI automatically.")
      );
      console.log(chalk.yellow("\nPlease install manually:"));
      console.log(chalk.white("  npm install -g vercel"));
      return false;
    }

    console.log(chalk.greenBright("\n✅ Vercel CLI installed successfully!"));
    return true;
  }

  return true;
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
    console.log(chalk.blueBright("\nTo authenticate with Vercel:"));
    console.log(chalk.cyan("Opening authentication flow...\n"));

    const loginResult = spawnSync("vercel", ["login"], {
      stdio: "inherit",
      shell: true,
    });

    if (loginResult.status !== 0) {
      console.log(chalk.red("\n❌ Authentication failed."));
      return false;
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
 * Create Vercel Postgres database via CLI
 */
const createVercelDatabase = async (name: string): Promise<string> => {
  console.log(
    chalk.blueBright(`\nCreating Vercel Postgres database '${name}'...`)
  );
  console.log(
    chalk.cyan("The Vercel CLI will guide you through the setup process.\n")
  );

  // The correct command is: vercel postgres create (without "storage")
  // Just use the interactive mode
  const createResult = spawnSync("npx", ["vercel", "postgres", "create"], {
    encoding: "utf-8",
    shell: true,
    stdio: "inherit",
    env: { ...process.env },
  });

  if (createResult.status !== 0) {
    console.error(chalk.red("\n❌ Failed to create Vercel Postgres database."));
    throw new Error("Database creation failed");
  }

  console.log(chalk.greenBright(`\n✅ Database created!`));

  // Get connection string
  console.log(chalk.blueBright("\nFetching connection string..."));

  // Wait a moment for the database to be ready
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // List all Postgres databases to find the one we just created
  console.log(chalk.dim("Retrieving database details...\n"));

  const listResult = spawnSync("npx", ["vercel", "postgres", "ls"], {
    encoding: "utf-8",
    shell: true,
    stdio: "pipe",
  });

  if (listResult.status === 0) {
    console.log(chalk.dim("Databases found. Fetching connection string...\n"));
  }

  // Try to pull environment variables
  const envResult = spawnSync(
    "npx",
    ["vercel", "env", "pull", ".env.vercel.local"],
    {
      encoding: "utf-8",
      shell: true,
      stdio: "pipe",
    }
  );

  if (envResult.status === 0) {
    const fs = require("fs");
    const path = require("path");

    try {
      const envPath = path.join(process.cwd(), ".env.vercel.local");
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, "utf-8");

        // Look for POSTGRES_URL or any URL with the database name
        const postgresUrlMatch = envContent.match(/POSTGRES_URL="?([^"\n]+)"?/);

        if (postgresUrlMatch && postgresUrlMatch[1]) {
          console.log(chalk.greenBright("✅ Connection string retrieved!"));

          // Clean up the temp file
          try {
            fs.unlinkSync(envPath);
          } catch (e) {
            // Ignore cleanup errors
          }

          return postgresUrlMatch[1];
        }
      }
    } catch (error) {
      console.log(chalk.dim("Could not read .env file automatically."));
    }
  }

  // Fallback: ask user to paste connection string
  console.log(
    chalk.yellow("\n⚠️  Could not automatically fetch connection string.")
  );
  console.log(chalk.cyan("\nPlease follow these steps:"));
  console.log(chalk.white("1. Go to: https://vercel.com/dashboard/stores"));
  console.log(chalk.white(`2. Find your database: ${name}`));
  console.log(chalk.white("3. Go to the '.env.local' tab"));
  console.log(chalk.white("4. Copy the POSTGRES_URL value\n"));

  const shouldOpen = await confirm({
    message: "Open Vercel dashboard now?",
    default: true,
  });

  if (shouldOpen) {
    openBrowser("https://vercel.com/dashboard/stores");
    console.log(chalk.greenBright("✅ Browser opened!\n"));
  }

  const databaseUrl = await input({
    message: chalk.cyan("Paste your POSTGRES_URL here:"),
    validate: (inputValue: string) => {
      if (!inputValue || !inputValue.startsWith("postgres")) {
        return "Invalid PostgreSQL connection string";
      }
      return true;
    },
  });

  return databaseUrl;
};

/**
 * Manual setup for Vercel (web-based)
 */
const setupVercelManually = async (): Promise<string> => {
  console.log(chalk.blueBright("\n📝 Vercel Postgres Setup\n"));
  console.log(chalk.cyan("Follow these steps to create your database:\n"));
  console.log(chalk.white("1. Click 'Create Database' on the page that opens"));
  console.log(chalk.white("2. Select 'Postgres' as the database type"));
  console.log(chalk.white("3. Choose a name and region for your database"));
  console.log(chalk.white("4. Click 'Create'"));
  console.log(chalk.white("5. Once created, go to the '.env.local' tab"));
  console.log(chalk.white("6. Copy the POSTGRES_URL value\n"));

  const shouldOpenBrowser = await confirm({
    message: "Open Vercel dashboard in your browser?",
    default: true,
  });

  if (shouldOpenBrowser) {
    openBrowser("https://vercel.com/dashboard/stores");
    console.log(chalk.greenBright("✅ Browser opened!"));
  } else {
    console.log(chalk.cyan("\nGo to: https://vercel.com/dashboard/stores"));
  }

  console.log(chalk.yellow("\n⏳ Waiting for you to create the database...\n"));

  const databaseUrl = await input({
    message: chalk.cyan("Paste your POSTGRES_URL here:"),
    validate: (inputValue: string) => {
      if (!inputValue || inputValue.trim().length === 0) {
        return "Connection string cannot be empty";
      }
      if (
        !inputValue.startsWith("postgres://") &&
        !inputValue.startsWith("postgresql://")
      ) {
        return "Invalid PostgreSQL connection string. Should start with postgres:// or postgresql://";
      }
      return true;
    },
  });

  return databaseUrl;
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

  const hasVercelCli = await ensureVercelCli();

  if (!hasVercelCli) {
    console.log(chalk.blueBright("\n🔄 Switching to manual setup...\n"));

    const databaseUrl = await setupVercelManually();

    console.log(
      chalk.greenBright(`\n✅ Vercel Postgres configured successfully!`)
    );
    console.log(chalk.greenBright(`\nYour DATABASE_URL is:\n${databaseUrl}\n`));
    console.log(chalk.yellow("--------------------------------"));

    return databaseUrl;
  }

  const isAuthenticated = checkVercelAuth();

  if (!isAuthenticated) {
    console.log(
      chalk.yellow(
        "\n⚠️  Switching to manual setup due to authentication issues...\n"
      )
    );

    const databaseUrl = await setupVercelManually();

    console.log(
      chalk.greenBright(`\n✅ Vercel Postgres configured successfully!`)
    );
    console.log(chalk.greenBright(`\nYour DATABASE_URL is:\n${databaseUrl}\n`));
    console.log(chalk.yellow("--------------------------------"));

    return databaseUrl;
  }

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

  try {
    const databaseUrl = await createVercelDatabase(dbName);

    console.log(
      chalk.greenBright(`\n✅ Vercel Postgres created successfully!`)
    );
    console.log(chalk.greenBright(`\nYour DATABASE_URL is:\n${databaseUrl}\n`));
    console.log(chalk.yellow("--------------------------------"));

    return databaseUrl;
  } catch (error) {
    console.log(
      chalk.yellow("\n⚠️  CLI setup failed. Switching to manual setup...\n")
    );

    const databaseUrl = await setupVercelManually();

    console.log(
      chalk.greenBright(`\n✅ Vercel Postgres configured successfully!`)
    );
    console.log(chalk.greenBright(`\nYour DATABASE_URL is:\n${databaseUrl}\n`));
    console.log(chalk.yellow("--------------------------------"));

    return databaseUrl;
  }
};
