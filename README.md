# 🗄️ Create DB Setup

> Interactive CLI for setting up PostgreSQL databases with multiple providers

[![npm version](https://badge.fury.io/js/%40yourusername%2Fcreate-db-setup.svg)](https://www.npmjs.com/package/@yourusername/create-db-setup)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🎯 **Multiple Providers**: Neon, Supabase, Railway, Local Docker
- 🌍 **Region Selection**: Choose from 11+ global regions with emoji flags
- ⚙️ **Auto Configuration**: Automatically writes database URL to .env
- 📁 **Custom .env Paths**: Support for any .env file location (.env, .env.local, config/.env, etc.)
- 🏷️ **Custom Variable Names**: Use any variable name (DATABASE_URL, POSTGRES_URL, DB_URL, etc.)
- 💾 **Safe Updates**: Creates backups before modifying files
- 🔒 **Overwrite Protection**: Asks before overwriting existing variables
- 🎨 **Beautiful CLI**: Color-coded, interactive prompts
- 🛡️ **Type Safe**: Written in TypeScript
- 🚀 **Zero Config**: Works out of the box with Bun or Node.js
- ⚡ **Fast**: Optimized for Bun runtime

## 🚀 Quick Start

### Run with bunx (Recommended)

```bash
bunx @yourusername/create-db-setup
```

### Or with npx

```bash
npx @yourusername/create-db-setup
```

### Or Install Globally

```bash
# With Bun
bun install -g @yourusername/create-db-setup

# With npm
npm install -g @yourusername/create-db-setup

# Then run
create-db-setup
```

### Or use the shorter alias

```bash
bunx @yourusername/create-db-setup
# or after global install
db-setup
```

## 📦 Supported Providers

### 🔷 Neon (Serverless PostgreSQL)

- Automatic CLI authentication
- 11 global regions (AWS + Azure)
- Pooled connections
- Free tier available

### 🟢 Supabase (Open Source Firebase Alternative)

- Project creation via CLI
- Global region selection
- Connection pooling
- Generous free tier

### 🚂 Railway (Platform as a Service)

- One-click PostgreSQL deployment
- Automatic environment variables
- Simple pricing

### 🐳 Local Docker

- Instant local PostgreSQL
- Pre-configured docker-compose
- Perfect for development

## 🎯 Usage

Simply run the CLI and follow the prompts:

```bash
$ bunx @yourusername/create-db-setup

================ Database Setup ================

? Choose your PostgreSQL provider:
  ❯ Neon (Serverless)
    Supabase (Cloud)
    Railway
    Local PostgreSQL (Docker)
    I already have a DATABASE_URL
    I'll configure later

[Select your provider and follow the interactive setup]

================ Environment Configuration ================

? Enter the path to your .env file: .env
? Enter the environment variable name for your database URL: DATABASE_URL

✅ DATABASE_URL has been added to your .env file!
```

### Flexible Configuration

The CLI now supports:

- **Custom .env file paths**: `.env`, `.env.local`, `config/.env`, etc.
- **Custom variable names**: `DATABASE_URL`, `POSTGRES_URL`, `DB_CONNECTION_STRING`, etc.
- **Automatic backup**: Creates `.env.backup` before making changes
- **Overwrite protection**: Asks before overwriting existing variables

## 🛠️ Requirements

- Node.js >= 18.0.0 OR Bun >= 1.0.0
- npm or yarn or pnpm or bun

## 📚 API

You can also use this as a library in your own Node.js projects:

```typescript
import { setupNeon, setupSupabase } from "@yourusername/create-db-setup";

// Use individual provider setups
const databaseUrl = await setupNeon();

// Or use the interactive CLI
import { handleDatabaseSetup } from "@yourusername/create-db-setup";
const databaseUrl = await handleDatabaseSetup();
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

MIT © [Your Name]

## 🙏 Acknowledgments

- [@inquirer/prompts](https://github.com/SBoudrias/Inquirer.js) for interactive CLI
- [chalk](https://github.com/chalk/chalk) for terminal styling
- All the database providers for their excellent CLIs

## 🐛 Known Issues

See [GitHub Issues](https://github.com/yourusername/create-db-setup/issues)

## 📮 Support

- 📧 Email: your.email@example.com
- 🐦 Twitter: [@yourusername](https://twitter.com/yourusername)
- 💬 Discord: [Join our server](https://discord.gg/yourserver)
