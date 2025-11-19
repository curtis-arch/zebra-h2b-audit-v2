# Project Overview

## Purpose
This is **zebra-h2b-audit-v2**, a modern full-stack TypeScript application for H2B audit management. Built with Better-T-Stack, it provides a comprehensive solution for audit workflows.

## Tech Stack

### Core Technologies
- **Language**: TypeScript (strict type safety throughout)
- **Framework**: Next.js 16 (App Router, React 19)
- **Package Manager**: Bun 1.3.0
- **Monorepo**: Turborepo with Bun workspaces

### Backend
- **API**: tRPC (end-to-end type-safe APIs)
- **Database**: PostgreSQL
- **ORM**: Drizzle (TypeScript-first ORM)
- **Authentication**: better-auth

### Frontend
- **UI Framework**: React 19.2.0
- **Styling**: Tailwind CSS 4.1
- **Component Library**: shadcn/ui with Radix UI primitives
- **Forms**: Tanstack React Form
- **State Management**: Tanstack React Query
- **Icons**: Lucide React
- **Theming**: next-themes
- **Notifications**: Sonner

### Developer Experience
- **Code Quality**: Biome 2.3.6 with Ultracite 6.3.4 preset
- **Build System**: Turbo (optimized monorepo builds)
- **Validation**: Zod 4.x

## Project Structure

```
zebra-h2b-audit-v2/
├── apps/
│   └── web/              # Main Next.js application (port 3001)
│       ├── src/          # Application source code
│       └── package.json  # Web app dependencies
├── packages/
│   ├── api/              # tRPC API layer & business logic
│   ├── auth/             # Authentication configuration
│   ├── db/               # Database schema, migrations & queries
│   └── config/           # Shared configuration packages
├── biome.json            # Biome configuration (extends Ultracite)
├── turbo.json            # Turborepo pipeline configuration
└── package.json          # Root workspace configuration
```

## Key Features
- Monorepo architecture with workspace dependencies
- Type-safe APIs from frontend to backend
- Shared workspace catalog for dependency management
- Optimized build caching with Turborepo
- Modern React 19 features (ref as prop, compiler, etc.)