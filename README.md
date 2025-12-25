# 🗄️ Database Setup CLI

> Interactive CLI for setting up PostgreSQL databases with multiple providers (Neon, Supabase, Railway, Local Docker)

[![npm version](https://badge.fury.io/js/%40sidgaikwad%2Fdb-setup.svg)](https://www.npmjs.com/package/@sidgaikwad/db-setup)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🎯 **Multiple Providers**: Neon, Supabase, Railway, Local Docker
- 🌍 **Region Selection**: Choose from 11+ global regions with emoji flags
- ⚙️ **Auto Configuration**: Automatically writes database URL to .env
- 📁 **Custom .env Paths**: Support for any .env file location
- 🏷️ **Custom Variable Names**: Use any variable name (DATABASE_URL, POSTGRES_URL, etc.)
- 💾 **Safe Updates**: Creates backups before modifying files
- 🔒 **Overwrite Protection**: Asks before overwriting existing variables
- 🎨 **Beautiful CLI**: Color-coded, interactive prompts
- 🚀 **Zero Config**: Works out of the box with Bun or Node.js

## 🚀 Quick Start

### Option 1: Run Without Installing (Recommended)

```bash
# With Bun
bunx @sidgaikwad/db-setup

# With npm
npx @sidgaikwad/db-setup
```

### Option 2: Install Locally

```bash
# With Bun
bun add @sidgaikwad/db-setup

# With npm
npm install @sidgaikwad/db-setup

# With pnpm
pnpm add @sidgaikwad/db-setup

# With yarn
yarn add @sidgaikwad/db-setup
```

**Then run:**

```bash
# Using package scripts
bun run create-db-setup
# or
npm run create-db-setup

# Using npx/bunx
bunx @sidgaikwad/db-setup
# or
npx @sidgaikwad/db-setup
```

### Option 3: Install Globally

```bash
# With Bun
bun install -g @sidgaikwad/db-setup

# With npm
npm install -g @sidgaikwad/db-setup

# Then run anywhere
create-db-setup
# or
db-setup
```

## 📦 Adding to Your Project

### In Next.js, Remix, or any Node.js project:

```bash
# Install the package
bun add @sidgaikwad/db-setup

# Add to package.json scripts (optional)
```

**package.json:**

```json
{
  "scripts": {
    "db:setup": "create-db-setup",
    "setup": "create-db-setup"
  }
}
```

**Then run:**

```bash
bun run db:setup
# or
npm run db:setup
```

## 🎯 Usage

```bash
$ bunx @sidgaikwad/db-setup

🗄️  Database Setup CLI

Configure your PostgreSQL database with ease!

================ Database Setup ================

? Choose your PostgreSQL provider: (Use arrow keys)
  ❯ Neon (Serverless PostgreSQL)
    Supabase (Open Source Firebase Alternative)
    Railway (Platform as a Service)
    Local PostgreSQL (Docker)
    I already have a DATABASE_URL
    I'll configure later

[Select your provider and follow the interactive setup]

================ Environment Configuration ================

? Select your .env file location: (Use arrow keys)
  ❯ .env (Root directory)
    .env.local (Local environment)
    .env.development (Development)
    .env.production (Production)
    config/.env (Config directory)
    apps/backend/.env (Monorepo backend)
    Custom path...

? Select the environment variable name: (Use arrow keys)
  ❯ DATABASE_URL (Standard)
    POSTGRES_URL (Alternative)
    DB_URL (Short form)
    DB_CONNECTION_STRING (Descriptive)
    DIRECT_URL (Prisma direct)
    DATABASE_CONNECTION (Verbose)
    Custom variable name...

✅ Database configured successfully!

🎉 Setup completed successfully!
```

## 📚 Supported Providers

### 🔷 Neon (Serverless PostgreSQL)

- Automatic CLI authentication
- 11 global regions (AWS + Azure)
- Pooled connections
- Free tier available
- **Regions**: US East, US West, EU Central, EU West, Asia Pacific, South America

### 🟢 Supabase (Open Source Firebase Alternative)

- Project creation via CLI
- Global region selection
- Connection pooling
- Generous free tier
- **Features**: Real-time, Auth, Storage, Edge Functions

### 🚂 Railway (Platform as a Service)

- One-click PostgreSQL deployment
- Automatic environment variables
- Simple pricing
- **Perfect for**: Quick deployments, side projects

### 🐳 Local Docker

- Instant local PostgreSQL
- Pre-configured docker-compose
- Perfect for development
- No cloud account needed

## 🛠️ Requirements

- Node.js >= 18.0.0 OR Bun >= 1.0.0
- npm, yarn, pnpm, or bun

## 💡 Examples

### Example 1: Standard Setup

```bash
bunx @sidgaikwad/db-setup
# Select: Neon
# Select: .env (Root directory)
# Select: DATABASE_URL (Standard)
```

### Example 2: Monorepo Setup

```bash
bunx @sidgaikwad/db-setup
# Select: Neon
# Select: apps/backend/.env (Monorepo backend)
# Select: DATABASE_URL (Standard)
```

### Example 3: Custom Variable Name

```bash
bunx @sidgaikwad/db-setup
# Select: Supabase
# Select: .env.local (Local environment)
# Select: POSTGRES_URL (Alternative)
```

### Example 4: Multiple Databases

```bash
# Primary database
bunx @sidgaikwad/db-setup
# Variable: DATABASE_URL

# Analytics database
bunx @sidgaikwad/db-setup
# Variable: ANALYTICS_DATABASE_URL
```

## 🔧 Integration with Frameworks

### Next.js

```bash
bun add @sidgaikwad/db-setup
bunx @sidgaikwad/db-setup
# Select: .env.local
# Select: DATABASE_URL
```

### Remix

```bash
bun add @sidgaikwad/db-setup
bunx @sidgaikwad/db-setup
# Select: .env
# Select: DATABASE_URL
```

### SvelteKit

```bash
bun add @sidgaikwad/db-setup
bunx @sidgaikwad/db-setup
# Select: .env
# Select: DATABASE_URL
```

### Express/Fastify

```bash
npm install @sidgaikwad/db-setup
npx @sidgaikwad/db-setup
# Select: .env
# Select: POSTGRES_URL
```

## 📝 Best Practices

### ✅ DO:

- Use `.env.local` for local development (not committed to git)
- Use `.env.production` for production-specific variables
- Use `.env.test` for testing environments
- Keep backups of your `.env` files (CLI creates them automatically)
- Use descriptive variable names for multiple databases

### ❌ DON'T:

- Don't commit `.env` files with real credentials to git
- Don't use the same database for development and production
- Don't forget to add `.env*` to your `.gitignore`

### 🔒 Security

**.gitignore:**

```gitignore
.env
.env.local
.env.*.local
.env.backup
```

**.env.example** (commit this):

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

MIT © [Siddharth Gaikwad](https://github.com/sidgaikwad)

## 🙏 Acknowledgments

- [@inquirer/prompts](https://github.com/SBoudrias/Inquirer.js) for interactive CLI
- [chalk](https://github.com/chalk/chalk) for terminal styling
- [Neon](https://neon.tech), [Supabase](https://supabase.com), [Railway](https://railway.app) for excellent database services

## 🐛 Issues & Support

Found a bug or need help?

- 🐛 [Report an issue](https://github.com/sidgaikwad/db-setup/issues)
- 💬 [Start a discussion](https://github.com/sidgaikwad/db-setup/discussions)
- 📧 Email: gaikwadsiddharth039@gmail.com

## 📮 Links

- 📦 [NPM Package](https://www.npmjs.com/package/@sidgaikwad/db-setup)
- 🐙 [GitHub Repository](https://github.com/sidgaikwad/db-setup)
- 📚 [Documentation](https://github.com/sidgaikwad/db-setup#readme)

---

Made with ❤️ by [Siddharth Gaikwad](https://github.com/sidgaikwad)
