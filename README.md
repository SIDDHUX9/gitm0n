# GITM0N — GitHub Code Monitor

A production-ready web app that analyzes any GitHub user's total lines of code across all repositories, with a 3D city visualization, leaderboard, and shareable code reports.

## Features

- **Full LOC Analysis** — Total lines of code split into code / comments / blanks
- **Per-Language Breakdown** — Language distribution with percentages and colors
- **Top Repos Ranking** — Top 20 repositories by LOC
- **Estimated Coding Hours** — Derived from commit-based line additions
- **Percentile Rank** — Compare your LOC against all analyzed developers
- **3D City Visualization** — Immersive CodeWorld built with Three.js; each developer gets a unique city block
- **Leaderboard** — Public ranking of all analyzed developers
- **Admin Panel** — Password-protected panel at `/admin` to manage user data
- **Caching** — Analyses cached for 1 hour to minimize GitHub API usage

## Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind v4, Shadcn UI, Framer Motion, Three.js
- **Backend**: Convex (serverless database + functions)
- **Auth**: Convex Auth (email OTP)
- **Routing**: React Router v7

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed
- [Convex](https://convex.dev) account

### Local Development

```bash
# Install dependencies
bun install

# Start development server
bun run dev
```

### Environment Variables

Create a `.env.local` file with:

```
CONVEX_DEPLOYMENT=your-deployment
VITE_CONVEX_URL=your-convex-url
```

## Project Structure

```
src/
├── components/     # React components
│   └── ui/        # Shadcn UI components
├── pages/         # Page components
├── convex/        # Convex backend
├── hooks/         # Custom React hooks
└── lib/           # Utility functions
```

## Development Guidelines

See [VLY.md](./VLY.md) for detailed development conventions and best practices.

## Available Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run type-check` - Run TypeScript type checking
- `bun run lint` - Run ESLint
- `bun run format` - Format code with Prettier
- `bun run preview` - Preview production build
- `bun run test` - Run tests
- `bun run test:watch` - Run tests in watch mode

## Contributing

<!-- AI Agent: Add contribution guidelines if applicable -->

## License

<!-- AI Agent: Add license information -->

---

**Note for AI Agents:** This README should be updated to reflect the actual application being built. Keep it concise and user-focused. For detailed development conventions, refer to [VLY.md](./VLY.md).