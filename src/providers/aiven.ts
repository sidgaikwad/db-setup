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
 * Check if Aiven CLI is installed and offer to install it
 */
const ensureAivenCli = async (): Promise<boolean> => {
  const check = spawnSync("avn", ["--version"], {
    encoding: "utf-8",
    shell: true,
    stdio: "pipe",
  });

  if (check.status !== 0) {
    console.log(chalk.yellowBright("\n⚠️  Aiven CLI is not installed."));

    const shouldInstall = await confirm({
      message: "Would you like to install Aiven CLI automatically?",
      default: true,
    });

    if (!shouldInstall) {
      return false;
    }

    console.log(chalk.blueBright("\nInstalling Aiven CLI..."));
    const install = spawnSync("pip3", ["install", "aiven-client"], {
      shell: true,
      stdio: "inherit",
    });

    if (install.status !== 0) {
      console.log(chalk.red("\n❌ Failed to install Aiven CLI automatically."));
      console.log(chalk.yellow("\nPlease install manually:"));
      console.log(chalk.white("  pip3 install aiven-client"));
      console.log(chalk.white("  or"));
      console.log(chalk.white("  brew install aiven"));
      return false;
    }

    console.log(chalk.greenBright("\n✅ Aiven CLI installed successfully!"));
    return true;
  }

  return true;
};

/**
 * Check authentication with Aiven
 */
const checkAivenAuth = (): boolean => {
  console.log(chalk.blueBright("\nChecking Aiven authentication..."));

  const authCheck = spawnSync("avn", ["user", "info"], {
    encoding: "utf-8",
    shell: true,
    stdio: "pipe",
  });

  if (authCheck.status !== 0) {
    console.log(chalk.yellowBright("Not logged in to Aiven."));
    console.log(chalk.blueBright("\nTo authenticate with Aiven:"));
    console.log(
      chalk.cyan("You'll need to provide your email and password.\n")
    );

    const loginResult = spawnSync("avn", ["user", "login"], {
      stdio: "inherit",
      shell: true,
    });

    if (loginResult.status !== 0) {
      console.log(chalk.red("\n❌ Authentication failed."));
      return false;
    }

    console.log(
      chalk.greenBright("\n✅ Successfully authenticated with Aiven!")
    );
    return true;
  }

  console.log(chalk.greenBright("✅ Already logged in to Aiven."));
  return true;
};

/**
 * Get available Aiven clouds (regions)
 */
const getAivenClouds = (): Array<{ name: string; value: string }> => {
  return [
    { name: "🇺🇸 Google US Central (Iowa)", value: "google-us-central1" },
    { name: "🇺🇸 Google US East (S. Carolina)", value: "google-us-east1" },
    { name: "🇺🇸 AWS US East (N. Virginia)", value: "aws-us-east-1" },
    { name: "🇺🇸 AWS US West (Oregon)", value: "aws-us-west-2" },
    { name: "🇪🇺 Google Europe West (Belgium)", value: "google-europe-west1" },
    { name: "🇪🇺 AWS Europe (Ireland)", value: "aws-eu-west-1" },
    { name: "🇪🇺 AWS Europe (Frankfurt)", value: "aws-eu-central-1" },
    { name: "🇸🇬 AWS Asia Pacific (Singapore)", value: "aws-ap-southeast-1" },
    { name: "🇯🇵 AWS Asia Pacific (Tokyo)", value: "aws-ap-northeast-1" },
  ];
};

/**
 * Get or create Aiven project
 */
const getAivenProject = async (): Promise<string> => {
  console.log(chalk.blueBright("\nFetching Aiven projects..."));

  const projectsResult = spawnSync("avn", ["project", "list", "--json"], {
    encoding: "utf-8",
    shell: true,
    stdio: "pipe",
  });

  if (projectsResult.status !== 0) {
    console.log(chalk.red("❌ Failed to fetch projects."));
    throw new Error("Failed to fetch projects");
  }

  try {
    const projects = JSON.parse(projectsResult.stdout);

    if (projects.length === 0) {
      console.log(
        chalk.yellow("\n⚠️  No projects found. Creating a default project...")
      );

      const createResult = spawnSync(
        "avn",
        ["project", "create", "zerostarter-project"],
        {
          encoding: "utf-8",
          shell: true,
          stdio: "inherit",
        }
      );

      if (createResult.status !== 0) {
        throw new Error("Failed to create project");
      }

      return "zerostarter-project";
    }

    // If there's only one project, use it
    if (projects.length === 1) {
      console.log(
        chalk.greenBright(`✅ Using project: ${projects[0].project_name}`)
      );
      return projects[0].project_name;
    }

    // Let user choose from multiple projects
    const choices: Array<{ name: string; value: string }> = projects.map((p: any) => ({
      name: p.project_name,
      value: p.project_name,
    }));

    const selectedProject = await select({
      message: chalk.cyan("Select an Aiven project:"),
      choices,
    });

    return selectedProject;
  } catch (error) {
    console.log(chalk.red("❌ Failed to parse projects."));
    throw error;
  }
};

/**
 * Create Aiven PostgreSQL service
 */
const createAivenService = async (
  project: string,
  serviceName: string,
  cloud: string
): Promise<void> => {
  console.log(
    chalk.blueBright(`\nCreating Aiven PostgreSQL service '${serviceName}'...`)
  );

  // Create service with free plan (hobbyist)
  const createResult = spawnSync(
    "avn",
    [
      "service",
      "create",
      serviceName,
      "--project",
      project,
      "--service-type",
      "pg",
      "--cloud",
      cloud,
      "--plan",
      "hobbyist", // Free tier
    ],
    {
      encoding: "utf-8",
      shell: true,
      stdio: "inherit",
    }
  );

  if (createResult.status !== 0) {
    console.log(chalk.red("\n❌ Failed to create Aiven PostgreSQL service."));
    throw new Error("Service creation failed");
  }

  console.log(chalk.greenBright(`\n✅ Service '${serviceName}' created!`));
  console.log(
    chalk.yellow(
      "\n⏳ Waiting for service to become available (this may take 2-3 minutes)..."
    )
  );

  // Wait for service to be running
  let isRunning = false;
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes

  while (!isRunning && attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const statusResult = spawnSync(
      "avn",
      ["service", "get", serviceName, "--project", project, "--json"],
      {
        encoding: "utf-8",
        shell: true,
        stdio: "pipe",
      }
    );

    if (statusResult.status === 0) {
      try {
        const service = JSON.parse(statusResult.stdout);
        if (service.state === "RUNNING") {
          isRunning = true;
        }
      } catch (e) {
        // Continue waiting
      }
    }

    attempts++;
    if (attempts % 6 === 0) {
      console.log(chalk.dim(`Still waiting... (${attempts * 5}s elapsed)`));
    }
  }

  if (!isRunning) {
    console.log(chalk.red("\n❌ Service took too long to start."));
    console.log(chalk.yellow("Please check your Aiven console for status."));
    throw new Error("Service startup timeout");
  }

  console.log(chalk.greenBright("✅ Service is now running!"));
};

/**
 * Get connection string for Aiven service
 */
const getAivenConnectionString = (
  project: string,
  serviceName: string
): string => {
  console.log(chalk.blueBright("\nFetching connection string..."));

  const serviceResult = spawnSync(
    "avn",
    ["service", "get", serviceName, "--project", project, "--json"],
    {
      encoding: "utf-8",
      shell: true,
      stdio: "pipe",
    }
  );

  if (serviceResult.status !== 0) {
    console.log(chalk.red("❌ Failed to get service details."));
    throw new Error("Failed to get connection string");
  }

  try {
    const service = JSON.parse(serviceResult.stdout);
    const connectionInfo = service.connection_info;

    if (!connectionInfo || !connectionInfo.pg_uri) {
      throw new Error("Connection info not available");
    }

    return connectionInfo.pg_uri[0]; // Return the first URI
  } catch (error) {
    console.log(chalk.red("❌ Failed to parse service details."));
    throw error;
  }
};

/**
 * Manual setup for Aiven (web-based) - fallback
 */
const setupAivenManually = async (): Promise<string> => {
  console.log(chalk.blueBright("\n📝 Aiven PostgreSQL Setup\n"));
  console.log(chalk.cyan("Follow these steps to create your database:\n"));
  console.log(chalk.white("1. Click 'Create service' on the page that opens"));
  console.log(chalk.white("2. Select 'PostgreSQL' as the service type"));
  console.log(chalk.white("3. Choose 'Hobbyist' plan (free tier)"));
  console.log(chalk.white("4. Select your preferred cloud and region"));
  console.log(chalk.white("5. Click 'Create service'"));
  console.log(chalk.white("6. Wait for service to start (2-3 minutes)"));
  console.log(chalk.white("7. Copy the 'Service URI' from the Overview tab\n"));

  const shouldOpenBrowser = await confirm({
    message: "Open Aiven console in your browser?",
    default: true,
  });

  if (shouldOpenBrowser) {
    openBrowser("https://console.aiven.io/");
    console.log(chalk.greenBright("✅ Browser opened!"));
  } else {
    console.log(chalk.cyan("\nGo to: https://console.aiven.io/"));
  }

  console.log(chalk.yellow("\n⏳ Waiting for you to create the service...\n"));

  const databaseUrl = await input({
    message: chalk.cyan("Paste your Service URI here:"),
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
 * Main function to set up Aiven PostgreSQL
 */
export const setupAiven = async (): Promise<string> => {
  console.log(
    chalk.magentaBright("\n================ Aiven Setup ================\n")
  );

  const hasAivenCli = await ensureAivenCli();

  if (!hasAivenCli) {
    console.log(chalk.blueBright("\n🔄 Switching to manual setup...\n"));

    const databaseUrl = await setupAivenManually();

    console.log(
      chalk.greenBright(`\n✅ Aiven PostgreSQL configured successfully!`)
    );
    console.log(chalk.greenBright(`\nYour DATABASE_URL is:\n${databaseUrl}\n`));
    console.log(chalk.yellow("--------------------------------"));

    return databaseUrl;
  }

  const isAuthenticated = checkAivenAuth();

  if (!isAuthenticated) {
    console.log(
      chalk.yellow(
        "\n⚠️  Switching to manual setup due to authentication issues...\n"
      )
    );

    const databaseUrl = await setupAivenManually();

    console.log(
      chalk.greenBright(`\n✅ Aiven PostgreSQL configured successfully!`)
    );
    console.log(chalk.greenBright(`\nYour DATABASE_URL is:\n${databaseUrl}\n`));
    console.log(chalk.yellow("--------------------------------"));

    return databaseUrl;
  }

  try {
    const project = await getAivenProject();

    const clouds = getAivenClouds();

    const selectedCloud = await select({
      message: chalk.cyan("Choose your Aiven cloud region:"),
      default: "google-us-central1",
      choices: clouds,
    });

    const serviceName = await input({
      message: chalk.cyan("Enter a name for your database service:"),
      default: "zerostarter-db",
      validate: (inputValue: string) => {
        if (!inputValue || inputValue.trim().length === 0) {
          return "Service name cannot be empty";
        }
        if (!/^[a-z0-9-]+$/.test(inputValue)) {
          return "Service name must contain only lowercase letters, numbers, and hyphens";
        }
        return true;
      },
    });

    await createAivenService(project, serviceName, selectedCloud);

    const databaseUrl = getAivenConnectionString(project, serviceName);

    console.log(
      chalk.greenBright(`\n✅ Aiven PostgreSQL created successfully!`)
    );
    console.log(chalk.greenBright(`\nYour DATABASE_URL is:\n${databaseUrl}\n`));
    console.log(chalk.yellow("--------------------------------"));

    return databaseUrl;
  } catch (error) {
    console.log(
      chalk.yellow("\n⚠️  CLI setup failed. Switching to manual setup...\n")
    );

    const databaseUrl = await setupAivenManually();

    console.log(
      chalk.greenBright(`\n✅ Aiven PostgreSQL configured successfully!`)
    );
    console.log(chalk.greenBright(`\nYour DATABASE_URL is:\n${databaseUrl}\n`));
    console.log(chalk.yellow("--------------------------------"));

    return databaseUrl;
  }
};
