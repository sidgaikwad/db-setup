import { spawnSync } from "child_process";
import { input, confirm } from "@inquirer/prompts";
import chalk from "chalk";
import * as fs from "fs";
import * as path from "path";

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
 * Create a temporary Next.js project structure
 */
const createTempNextJsProject = (tempDir: string): void => {
  // Create directory
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Create minimal package.json for Next.js
  const packageJson = {
    name: "vercel-postgres-temp",
    version: "1.0.0",
    private: true,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
    },
    dependencies: {
      next: "latest",
      react: "latest",
      "react-dom": "latest",
    },
  };

  fs.writeFileSync(
    path.join(tempDir, "package.json"),
    JSON.stringify(packageJson, null, 2)
  );

  // Create app directory (Next.js App Router)
  const appDir = path.join(tempDir, "app");
  if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir, { recursive: true });
  }

  // Create a simple page.tsx
  const pageTsx = `export default function Home() {
  return <div>Vercel Postgres Setup</div>
}`;

  fs.writeFileSync(path.join(appDir, "page.tsx"), pageTsx);

  // Create next.config.js
  const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = nextConfig`;

  fs.writeFileSync(path.join(tempDir, "next.config.js"), nextConfig);

  console.log(chalk.dim(`Created temporary Next.js project at: ${tempDir}`));
};

/**
 * Clean up temporary project
 */
const cleanupTempProject = (tempDir: string): void => {
  try {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log(chalk.dim("Cleaned up temporary project"));
    }
  } catch (error) {
    console.log(
      chalk.dim("Could not clean up temporary project (non-critical)")
    );
  }
};

/**
 * Setup Vercel project link in temp directory
 */
const setupVercelProject = (tempDir: string): boolean => {
  console.log(chalk.blueBright("\nLinking to Vercel project..."));
  console.log(
    chalk.cyan("You'll be prompted to select or create a Vercel project.\n")
  );

  const linkResult = spawnSync("vercel", ["link"], {
    encoding: "utf-8",
    shell: true,
    stdio: "inherit",
    cwd: tempDir,
  });

  if (linkResult.status !== 0) {
    console.log(chalk.red("\n❌ Failed to link Vercel project."));
    return false;
  }

  console.log(chalk.greenBright("\n✅ Project linked successfully!"));
  return true;
};

/**
 * Create Vercel Postgres database via CLI
 */
const createVercelDatabase = async (
  name: string,
  tempDir: string
): Promise<string> => {
  console.log(
    chalk.blueBright(`\nCreating Vercel Postgres database '${name}'...`)
  );
  console.log(
    chalk.cyan("The Vercel CLI will guide you through the setup process.\n")
  );

  const createResult = spawnSync("vercel", ["postgres", "create"], {
    encoding: "utf-8",
    shell: true,
    stdio: "inherit",
    cwd: tempDir,
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

  // Try to pull environment variables
  const envResult = spawnSync("vercel", ["env", "pull", ".env.local"], {
    encoding: "utf-8",
    shell: true,
    stdio: "pipe",
    cwd: tempDir,
  });

  if (envResult.status === 0) {
    try {
      const envPath = path.join(tempDir, ".env.local");
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, "utf-8");

        // Look for POSTGRES_URL
        const postgresUrlMatch = envContent.match(/POSTGRES_URL="?([^"\n]+)"?/);

        if (postgresUrlMatch && postgresUrlMatch[1]) {
          console.log(chalk.greenBright("✅ Connection string retrieved!"));
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
 * Manual setup for Vercel (web-based) - fallback only
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

  // Create temporary Next.js project
  const tempDir = path.join(process.cwd(), ".vercel-temp-project");
  console.log(
    chalk.blueBright("\nCreating temporary Next.js project structure...")
  );

  try {
    createTempNextJsProject(tempDir);

    // Link to Vercel project
    const projectLinked = setupVercelProject(tempDir);

    if (!projectLinked) {
      throw new Error("Project linking failed");
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

    const databaseUrl = await createVercelDatabase(dbName, tempDir);

    // Clean up temp project
    cleanupTempProject(tempDir);

    console.log(
      chalk.greenBright(`\n✅ Vercel Postgres created successfully!`)
    );
    console.log(chalk.greenBright(`\nYour DATABASE_URL is:\n${databaseUrl}\n`));
    console.log(chalk.yellow("--------------------------------"));

    return databaseUrl;
  } catch (error) {
    // Clean up temp project on error
    cleanupTempProject(tempDir);

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
