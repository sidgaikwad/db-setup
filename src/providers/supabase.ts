import { spawnSync } from "child_process";
import { select, input, confirm } from "@inquirer/prompts";
import chalk from "chalk";

interface SupabaseProject {
  id: string;
  name: string;
  region: string;
}

/**
 * Generate a random alphanumeric password
 */
function genAlphanumericPassword(length: number): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Check if user is authenticated with Supabase CLI
 */
const checkSupabaseAuth = async (): Promise<boolean> => {
  // Show spinner while checking
  process.stdout.write(
    chalk.blueBright("Checking Supabase authentication... ")
  );

  // Use 'npx supabase' to handle CLI automatically
  const authCheckResult = spawnSync("npx", ["supabase", "orgs", "list"], {
    encoding: "utf-8",
    shell: true,
    stdio: "pipe",
  });

  if (authCheckResult.status !== 0) {
    console.log(chalk.yellowBright("not logged in\n"));
    console.log(chalk.cyan("🔐 Opening browser for authentication..."));
    console.log(
      chalk.gray("Please complete the authentication in your browser.\n")
    );

    // Show that we're waiting
    console.log(chalk.blueBright("⏳ Waiting for authentication..."));

    const loginResult = spawnSync("npx", ["supabase", "login"], {
      stdio: "inherit",
      shell: true,
    });

    if (loginResult.status !== 0) {
      console.log(chalk.red("\n❌ Authentication failed or was cancelled."));
      process.exit(1);
    }

    console.log(chalk.greenBright("\n✅ Successfully authenticated!"));
    return true;
  }

  console.log(chalk.greenBright("✓"));
  return true;
};

/**
 * Logout from Supabase
 */
export const logoutSupabase = (): void => {
  console.log(chalk.blueBright("\nLogging out from Supabase..."));
  const logoutResult = spawnSync("supabase", ["logout"], {
    stdio: "inherit",
    shell: true,
  });

  if (logoutResult.status === 0) {
    console.log(chalk.greenBright("✅ Successfully logged out from Supabase."));
  } else {
    console.log(chalk.red("❌ Failed to logout."));
  }
};

/**
 * Get available Supabase regions
 */
const getSupabaseRegions = (): Array<{ name: string; value: string }> => {
  return [
    { name: "🇸🇬 Southeast Asia (Singapore)", value: "ap-southeast-1" },
    { name: "🇦🇺 Asia Pacific (Sydney)", value: "ap-southeast-2" },
    { name: "🇮🇳 Asia Pacific (Mumbai)", value: "ap-south-1" },
    { name: "🇯🇵 Asia Pacific (Tokyo)", value: "ap-northeast-1" },
    { name: "🇰🇷 Asia Pacific (Seoul)", value: "ap-northeast-2" },
    { name: "🇺🇸 US East (N. Virginia)", value: "us-east-1" },
    { name: "🇺🇸 US West (Oregon)", value: "us-west-1" },
    { name: "🇨🇦 Canada (Central)", value: "ca-central-1" },
    { name: "🇪🇺 Europe (Frankfurt)", value: "eu-central-1" },
    { name: "🇬🇧 Europe (London)", value: "eu-west-2" },
    { name: "🇧🇷 South America (São Paulo)", value: "sa-east-1" },
  ];
};

/**
 * Get or create a Supabase organization
 */
const getOrCreateSupabaseOrg = async (): Promise<void> => {
  process.stdout.write(chalk.blueBright("Checking organizations... "));

  const orgListResult = spawnSync("npx", ["supabase", "orgs", "list"], {
    encoding: "utf-8",
    shell: true,
    stdio: "pipe",
  });

  if (orgListResult.status !== 0) {
    console.log(chalk.red("✗"));
    console.error(chalk.red("❌ Failed to list Supabase orgs."));
    process.exit(1);
  }

  const lines = orgListResult.stdout
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const sepIdx = lines.findIndex(
    (line) => line.includes("|") && line.includes("-")
  );

  // No orgs exist
  if (lines.length <= sepIdx + 1) {
    console.log(chalk.yellowBright("none found\n"));
    console.log(chalk.yellowBright("⚠️  No Supabase organizations found."));

    const createOrg = await confirm({
      message: chalk.cyan(
        "Would you like to create a new Supabase organization?"
      ),
      default: true,
    });

    if (!createOrg) {
      console.log(
        chalk.red("\n❌ Cannot continue without a Supabase organization.")
      );
      console.log(
        chalk.gray(
          "You can create one later at: https://supabase.com/dashboard\n"
        )
      );
      process.exit(1);
    }

    const orgName = await input({
      message: chalk.cyan("Enter a name for your new Supabase organization:"),
      validate: (inputValue: string) => {
        if (!inputValue || inputValue.trim().length < 3) {
          return "Organization name must be at least 3 characters";
        }
        return true;
      },
    });

    console.log(
      chalk.blueBright(`\n⏳ Creating Supabase organization '${orgName}'...`)
    );
    const createOrgResult = spawnSync(
      "npx",
      ["supabase", "orgs", "create", orgName],
      {
        stdio: "inherit",
        encoding: "utf-8",
        shell: true,
      }
    );

    if (createOrgResult.status !== 0) {
      console.error(chalk.red("\n❌ Failed to create Supabase organization."));
      process.exit(1);
    }

    console.log(chalk.greenBright("✅ Organization created!"));
  } else {
    console.log(chalk.greenBright("✓"));
  }
};

/**
 * Create a Supabase project and return project details
 */
const createSupabaseProject = async (
  projectName: string,
  dbPassword: string,
  region: string
): Promise<{ projectId: string; region: string }> => {
  console.log(
    chalk.blueBright(
      `\n⏳ Creating Supabase project '${projectName}' in ${region}...`
    )
  );
  console.log(chalk.gray("This may take 2-3 minutes. Please wait...\n"));

  const createResult = spawnSync(
    "npx",
    [
      "supabase",
      "projects",
      "create",
      projectName,
      "--db-password",
      dbPassword,
      "--region",
      region,
      "--plan",
      "free",
    ],
    { stdio: "inherit", encoding: "utf-8", shell: true }
  );

  if (createResult.status !== 0) {
    console.error(chalk.red("\n❌ Failed to create Supabase project."));
    console.log(chalk.yellow("\nPossible reasons:"));
    console.log(
      chalk.gray("  • You've reached the free project limit (2 projects)")
    );
    console.log(chalk.gray("  • Project name already exists"));
    console.log(chalk.gray("  • Organization quota exceeded\n"));
    console.log(chalk.cyan("💡 Solutions:"));
    console.log(
      chalk.gray(
        "  1. Delete or pause an existing project at https://supabase.com/dashboard"
      )
    );
    console.log(chalk.gray("  2. Upgrade your plan"));
    console.log(chalk.gray("  3. Use a different organization\n"));

    const shouldLogout = await confirm({
      message: chalk.yellow(
        "Would you like to logout and try with a different account?"
      ),
      default: false,
    });

    if (shouldLogout) {
      logoutSupabase();
      console.log(
        chalk.cyan("\nRun the setup again to login with a different account.\n")
      );
    }

    process.exit(1);
  }

  process.stdout.write(chalk.blueBright("\nFetching project details... "));

  // List projects to get project details
  const listResult = spawnSync(
    "npx",
    ["supabase", "projects", "list", "--output", "json"],
    {
      encoding: "utf-8",
      shell: true,
      stdio: "pipe",
    }
  );

  if (listResult.status !== 0) {
    console.log(chalk.red("✗"));
    console.error(chalk.red("❌ Failed to list Supabase projects."));
    process.exit(1);
  }

  const projects: SupabaseProject[] = JSON.parse(listResult.stdout);
  const found = projects.find((p) => p.name === projectName);

  if (!found) {
    console.log(chalk.red("✗"));
    console.error(chalk.red("❌ Failed to find new Supabase project."));
    process.exit(1);
  }

  console.log(chalk.greenBright("✓"));

  return {
    projectId: found.id,
    region: found.region,
  };
};

/**
 * Main function to set up Supabase and return DATABASE_URL
 */
export const setupSupabase = async (): Promise<string> => {
  console.log(
    chalk.magentaBright("\n================ Supabase Setup ================\n")
  );

  // Check authentication
  checkSupabaseAuth();

  // Ensure org exists
  await getOrCreateSupabaseOrg();

  // Select region
  const regions = getSupabaseRegions();
  const selectedRegion = await select({
    message: chalk.cyan("Select your Supabase region:"),
    choices: regions,
    default: "ap-south-1",
  });

  // Project configuration
  const projectName = await input({
    message: chalk.cyan("Enter a name for your Supabase project:"),
    default: "my-supabase-project",
    validate: (inputValue: string) => {
      if (!inputValue || inputValue.trim().length === 0) {
        return "Project name cannot be empty";
      }
      if (inputValue.length > 64) {
        return "Project name must be 64 characters or less";
      }
      // Supabase project names should be lowercase alphanumeric with hyphens
      if (!/^[a-z0-9-]+$/.test(inputValue)) {
        return "Project name must contain only lowercase letters, numbers, and hyphens";
      }
      return true;
    },
  });

  // Generate secure password
  const dbPassword = genAlphanumericPassword(24);
  console.log(chalk.gray(`\n🔑 Generated secure database password`));

  // Create project
  const { projectId, region } = await createSupabaseProject(
    projectName,
    dbPassword,
    selectedRegion
  );

  // Construct DATABASE_URL (pooled connection)
  const databaseUrl = `postgresql://postgres.${projectId}:${dbPassword}@aws-0-${region}.pooler.supabase.com:6543/postgres`;

  console.log(chalk.greenBright(`\n✅ Supabase project created successfully!`));
  console.log(chalk.greenBright(`Project ID: ${projectId}`));
  console.log(chalk.greenBright(`Region: ${region}`));
  console.log(chalk.gray(`\n💡 Save this password safely: ${dbPassword}`));
  console.log(
    chalk.gray(
      `Dashboard: https://supabase.com/dashboard/project/${projectId}\n`
    )
  );
  console.log(chalk.yellow("--------------------------------"));

  return databaseUrl;
};
