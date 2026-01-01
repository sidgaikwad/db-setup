import { spawnSync } from "child_process";
import { select, input, confirm } from "@inquirer/prompts";
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
 * Check if Render CLI is installed and offer to install it
 */
const ensureRenderCli = async (): Promise<boolean> => {
  const check = spawnSync("render", ["--version"], {
    encoding: "utf-8",
    shell: true,
    stdio: "pipe",
  });

  if (check.status !== 0) {
    console.log(chalk.yellowBright("\n⚠️  Render CLI is not installed."));

    const shouldInstall = await confirm({
      message: "Would you like to install Render CLI automatically?",
      default: true,
    });

    if (!shouldInstall) {
      return false;
    }

    console.log(chalk.blueBright("\nInstalling Render CLI..."));
    // Fixed package name: it's just "render" not "@render-cli/cli"
    const install = spawnSync("npm", ["install", "-g", "render"], {
      shell: true,
      stdio: "inherit",
    });

    if (install.status !== 0) {
      console.log(
        chalk.red("\n❌ Failed to install Render CLI automatically.")
      );
      console.log(chalk.yellow("\nPlease install manually:"));
      console.log(chalk.white("  npm install -g render"));
      console.log(chalk.white("  or"));
      console.log(chalk.white("  brew install renderinc/tap/render"));
      return false;
    }

    console.log(chalk.greenBright("\n✅ Render CLI installed successfully!"));
    return true;
  }

  return true;
};

/**
 * Manual setup for Render (web-based)
 */
const setupRenderManually = async (): Promise<string> => {
  console.log(chalk.blueBright("\n📝 Manual Render PostgreSQL Setup\n"));
  console.log(chalk.cyan("Follow these steps to create your database:\n"));
  console.log(
    chalk.white("1. Go to: https://dashboard.render.com/new/database")
  );
  console.log(chalk.white("2. Click 'New PostgreSQL'"));
  console.log(chalk.white("3. Choose a name and region"));
  console.log(
    chalk.white("4. Select the 'Free' plan (or your preferred plan)")
  );
  console.log(chalk.white("5. Click 'Create Database'"));
  console.log(
    chalk.white("6. Once created, find the 'External Database URL' section")
  );
  console.log(chalk.white("7. Copy the connection string\n"));

  const shouldOpenBrowser = await confirm({
    message: "Would you like to open Render dashboard in your browser?",
    default: true,
  });

  if (shouldOpenBrowser) {
    openBrowser("https://dashboard.render.com/new/database");
    console.log(chalk.greenBright("\n✅ Browser opened!"));
  }

  console.log(chalk.yellow("\n⏳ Waiting for you to create the database...\n"));

  const databaseUrl = await input({
    message: chalk.cyan("Paste your External Database URL here:"),
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
 * Check authentication with Render
 */
const checkRenderAuth = async (): Promise<boolean> => {
  console.log(chalk.blueBright("\nChecking Render authentication..."));

  const authCheck = spawnSync("render", ["whoami"], {
    encoding: "utf-8",
    shell: true,
    stdio: "pipe",
  });

  if (authCheck.status !== 0) {
    console.log(chalk.yellowBright("Not logged in to Render."));
    console.log(chalk.blueBright("\nTo authenticate with Render:"));
    console.log(chalk.cyan("Opening authentication flow...\n"));

    const loginResult = spawnSync("render", ["login"], {
      stdio: "inherit",
      shell: true,
    });

    if (loginResult.status !== 0) {
      console.log(chalk.red("\n❌ Authentication failed."));
      return false;
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
 * Create Render PostgreSQL database via CLI
 */
const createRenderDatabaseCLI = async (
  name: string,
  region: string
): Promise<string> => {
  console.log(
    chalk.blueBright(`\nCreating Render PostgreSQL database '${name}'...`)
  );

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
      "free",
    ],
    {
      encoding: "utf-8",
      shell: true,
      stdio: "inherit",
    }
  );

  if (createResult.status !== 0) {
    console.error(chalk.red("\n❌ Failed to create Render database."));
    throw new Error("Database creation failed");
  }

  console.log(
    chalk.blueBright(
      "\n⏳ Waiting for database to provision (this may take 2-3 minutes)..."
    )
  );
  console.log(
    chalk.dim("You can also check status at: https://dashboard.render.com\n")
  );

  // Give it some time to provision
  await new Promise((resolve) => setTimeout(resolve, 10000));

  // Get the connection string
  console.log(chalk.blueBright("\nFetching connection string..."));
  console.log(
    chalk.yellow(
      "Please check your Render dashboard for the External Database URL."
    )
  );
  console.log(chalk.cyan("https://dashboard.render.com\n"));

  const databaseUrl = await input({
    message: chalk.cyan("Paste your External Database URL:"),
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
 * Main function to set up Render PostgreSQL
 */
export const setupRender = async (): Promise<string> => {
  console.log(
    chalk.magentaBright(
      "\n================ Render PostgreSQL Setup ================\n"
    )
  );

  // Check if CLI is installed
  const hasRenderCli = await ensureRenderCli();

  if (!hasRenderCli) {
    // Fallback to manual setup
    console.log(chalk.blueBright("\n🔄 Switching to manual setup...\n"));
    const databaseUrl = await setupRenderManually();

    console.log(
      chalk.greenBright(`\n✅ Render PostgreSQL configured successfully!`)
    );
    console.log(chalk.greenBright(`\nYour DATABASE_URL is:\n${databaseUrl}\n`));
    console.log(chalk.yellow("--------------------------------"));

    return databaseUrl;
  }

  // Check authentication
  const isAuthenticated = await checkRenderAuth();

  if (!isAuthenticated) {
    console.log(
      chalk.yellow(
        "\n⚠️  Switching to manual setup due to authentication issues...\n"
      )
    );
    const databaseUrl = await setupRenderManually();

    console.log(
      chalk.greenBright(`\n✅ Render PostgreSQL configured successfully!`)
    );
    console.log(chalk.greenBright(`\nYour DATABASE_URL is:\n${databaseUrl}\n`));
    console.log(chalk.yellow("--------------------------------"));

    return databaseUrl;
  }

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

  try {
    const databaseUrl = await createRenderDatabaseCLI(dbName, selectedRegion);

    console.log(
      chalk.greenBright(`\n✅ Render PostgreSQL created successfully!`)
    );
    console.log(chalk.greenBright(`\nYour DATABASE_URL is:\n${databaseUrl}\n`));
    console.log(chalk.yellow("--------------------------------"));

    return databaseUrl;
  } catch (error) {
    console.log(
      chalk.yellow("\n⚠️  CLI setup failed. Switching to manual setup...\n")
    );
    const databaseUrl = await setupRenderManually();

    console.log(
      chalk.greenBright(`\n✅ Render PostgreSQL configured successfully!`)
    );
    console.log(chalk.greenBright(`\nYour DATABASE_URL is:\n${databaseUrl}\n`));
    console.log(chalk.yellow("--------------------------------"));

    return databaseUrl;
  }
};
