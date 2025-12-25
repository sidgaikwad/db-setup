import { existsSync, readFileSync, writeFileSync, copyFileSync } from "fs";
import { resolve, dirname } from "path";
import { input, confirm, select } from "@inquirer/prompts";
import chalk from "chalk";

interface EnvConfig {
  envPath: string;
  variableName: string;
}

/**
 * Initialize .env file from .env.example if it exists
 */
export function initializeEnvFile(): void {
  if (existsSync(".env.example") && !existsSync(".env")) {
    try {
      copyFileSync(".env.example", ".env");
      console.log(chalk.greenBright("✅ Created .env file from .env.example"));
    } catch (error) {
      console.log(chalk.yellow("⚠️  Could not copy .env.example to .env"));
    }
  }
}

/**
 * Ask user for .env file location and variable name
 */
export async function getEnvConfig(): Promise<EnvConfig> {
  console.log(
    chalk.blueBright(
      "\n================ Environment Configuration ================\n"
    )
  );

  // Ask for .env file path with common options
  const envPathChoice = await select({
    message: chalk.cyan("Select your .env file location:"),
    choices: [
      { name: ".env (Root directory)", value: ".env" },
      { name: ".env.local (Local environment)", value: ".env.local" },
      { name: ".env.development (Development)", value: ".env.development" },
      { name: ".env.production (Production)", value: ".env.production" },
      { name: "config/.env (Config directory)", value: "config/.env" },
      {
        name: "apps/backend/.env (Monorepo backend)",
        value: "apps/backend/.env",
      },
      { name: "Custom path...", value: "custom" },
    ],
  });

  let envPath: string;

  if (envPathChoice === "custom") {
    envPath = await input({
      message: chalk.cyan("Enter custom path to your .env file:"),
      validate: (inputValue: string) => {
        if (!inputValue || inputValue.trim().length === 0) {
          return "Path cannot be empty";
        }

        const resolvedPath = resolve(process.cwd(), inputValue);
        const dir = dirname(resolvedPath);

        if (!existsSync(dir)) {
          return `Directory does not exist: ${dir}. Please create it first.`;
        }

        return true;
      },
    });
  } else {
    envPath = envPathChoice;
  }

  // Ask for variable name with common options
  const variableNameChoice = await select({
    message: chalk.cyan("Select the environment variable name:"),
    choices: [
      { name: "DATABASE_URL (Standard)", value: "DATABASE_URL" },
      { name: "POSTGRES_URL (Alternative)", value: "POSTGRES_URL" },
      { name: "DB_URL (Short form)", value: "DB_URL" },
      {
        name: "DB_CONNECTION_STRING (Descriptive)",
        value: "DB_CONNECTION_STRING",
      },
      { name: "DIRECT_URL (Prisma direct)", value: "DIRECT_URL" },
      { name: "DATABASE_CONNECTION (Verbose)", value: "DATABASE_CONNECTION" },
      { name: "Custom variable name...", value: "custom" },
    ],
  });

  let variableName: string;

  if (variableNameChoice === "custom") {
    variableName = await input({
      message: chalk.cyan("Enter custom variable name:"),
      validate: (inputValue: string) => {
        if (!inputValue || inputValue.trim().length === 0) {
          return "Variable name cannot be empty";
        }

        if (!/^[A-Z_][A-Z0-9_]*$/i.test(inputValue)) {
          return "Variable name must contain only letters, numbers, and underscores";
        }

        return true;
      },
    });
  } else {
    variableName = variableNameChoice;
  }

  const resolvedPath = resolve(process.cwd(), envPath);

  // Check if variable already exists
  if (existsSync(resolvedPath)) {
    const existingContent = readFileSync(resolvedPath, "utf-8");
    const variableRegex = new RegExp(`^${variableName}=`, "m");

    if (variableRegex.test(existingContent)) {
      console.log(
        chalk.yellowBright(`\n⚠️  ${variableName} already exists in ${envPath}`)
      );

      const shouldOverwrite = await confirm({
        message: chalk.yellow(`Overwrite existing ${variableName}?`),
        default: false,
      });

      if (!shouldOverwrite) {
        console.log(
          chalk.gray(
            "\nSetup cancelled. Your existing configuration was not modified."
          )
        );
        process.exit(0);
      }
    }
  } else {
    console.log(chalk.gray(`\n📝 ${envPath} will be created`));
  }

  return {
    envPath: resolvedPath,
    variableName: variableName.trim(),
  };
}

/**
 * Write database URL to .env file
 */
export async function writeDatabaseUrl(
  databaseUrl: string,
  config: EnvConfig
): Promise<void> {
  try {
    const { envPath, variableName } = config;

    let envContent = "";

    // Read existing content if file exists
    if (existsSync(envPath)) {
      envContent = readFileSync(envPath, "utf-8");

      // Create backup
      const backupPath = `${envPath}.backup`;
      writeFileSync(backupPath, envContent);
      console.log(chalk.gray(`\n💾 Backup created: ${backupPath}`));
    }

    // Check if variable already exists
    const variableRegex = new RegExp(`^${variableName}=.*$`, "m");

    // Escape $ in database URL for regex replacement
    const escapedUrl = databaseUrl.replace(/\$/g, "$$$$");

    if (variableRegex.test(envContent)) {
      // Replace existing variable
      envContent = envContent.replace(
        variableRegex,
        `${variableName}=${escapedUrl}`
      );
      console.log(
        chalk.greenBright(`\n✅ Updated ${variableName} in ${envPath}`)
      );
    } else {
      // Add new variable
      if (envContent.length > 0 && !envContent.endsWith("\n")) {
        envContent += "\n";
      }

      // Add section comment and variable
      envContent += `\n# Database Configuration\n${variableName}=${escapedUrl}\n`;
      console.log(
        chalk.greenBright(`\n✅ Added ${variableName} to ${envPath}`)
      );
    }

    // Write the updated content
    writeFileSync(envPath, envContent, "utf-8");

    console.log(chalk.cyan(`\n📍 Location: ${envPath}`));
    console.log(chalk.cyan(`📝 Variable: ${variableName}`));
  } catch (error) {
    console.error(chalk.red("\n❌ Failed to write to .env file:"), error);
    throw error;
  }
}

/**
 * Show the configured database URL (masked for security)
 */
export function showDatabaseUrl(
  databaseUrl: string,
  variableName: string
): void {
  // Mask the password in the connection string for display
  const maskedUrl = databaseUrl.replace(/(:\/\/)([^:]+):([^@]+)@/, "$1$2:***@");

  console.log(chalk.greenBright(`\n✅ Database configured successfully!`));
  console.log(chalk.gray(`\n${variableName}=${maskedUrl}`));
}

/**
 * Validate if a string is a valid PostgreSQL connection string
 */
export function validateConnectionString(url: string): boolean {
  const postgresUrlRegex = /^postgres(ql)?:\/\/.+/;
  return postgresUrlRegex.test(url);
}

/**
 * Complete environment setup flow
 */
export async function setupEnvironment(databaseUrl: string): Promise<void> {
  // Validate connection string
  if (!validateConnectionString(databaseUrl)) {
    console.error(
      chalk.red("\n❌ Invalid PostgreSQL connection string format")
    );
    throw new Error("Invalid connection string");
  }

  // Get environment configuration from user
  const config = await getEnvConfig();

  // Write to file
  await writeDatabaseUrl(databaseUrl, config);

  // Show success message with masked URL
  showDatabaseUrl(databaseUrl, config.variableName);
}
