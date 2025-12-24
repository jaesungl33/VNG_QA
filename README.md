# VNG QA

AI-powered Q&A system for game designers and developers. Built as a monorepo with Next.js frontend and FastAPI backend.

## Features

- **Workspaces**: Organize your game development projects
- **File Registry**: Track and reference project files
- **Smart Chat**: Ask questions with context using @doc, @codebase, or @file directives
- **Directive Parsing**: Parse and understand contextual references in queries

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI + Python + SQLAlchemy + PostgreSQL
- **Database**: PostgreSQL with Alembic migrations
- **Monorepo**: pnpm workspaces
- **Development**: Docker Compose for local database

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Python 3.11+
- Docker and Docker Compose

### 1. Clone and Install

```bash
git clone <repository-url>
cd vng-qa

# Install dependencies
make install
# or manually:
# pnpm install
# pip install -r apps/api/requirements.txt
```

### 2. Start Database

```bash
make db-up
# or: docker-compose -f infra/docker/docker-compose.yml up -d
```

### 3. Run Database Migrations

```bash
make db-migrate
# or: cd apps/api && alembic upgrade head
```

### 4. Start Development Servers

```bash
make dev
# or: pnpm run dev
```

This starts both the web app (http://localhost:3000) and API (http://localhost:8000).

## Development Commands

```bash
# Install dependencies
make install

# Start development servers
make dev

# Start individual services
make dev-web      # Next.js on :3000
make dev-api      # FastAPI on :8000

# Database operations
make db-up        # Start PostgreSQL
make db-down      # Stop PostgreSQL
make db-migrate   # Run migrations
make db-reset     # Reset database

# Code quality
make lint         # Run ESLint
make format       # Run Prettier
make test         # Run tests

# Build for production
make build
```

## Project Structure

```
vng-qa/
├── apps/
│   ├── web/                 # Next.js frontend
│   └── api/                 # FastAPI backend
├── packages/
│   ├── shared/              # TypeScript types & schemas
│   ├── api-client/          # Typed API client
│   └── rag-core/            # Directive parsing (stub)
├── infra/
│   └── docker/              # Docker configurations
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.json
├── .eslintrc.json
└── .prettierrc
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/vng_qa

# API
API_PORT=8000
CORS_ORIGINS=http://localhost:3000

# Web
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## API Endpoints

### Health
- `GET /api/health` - Health check

### Workspaces
- `GET /api/workspaces` - List workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/{id}` - Get workspace
- `PUT /api/workspaces/{id}` - Update workspace
- `DELETE /api/workspaces/{id}` - Delete workspace

### Files
- `GET /api/workspaces/{workspace_id}/files` - List files
- `POST /api/workspaces/{workspace_id}/files` - Create file record
- `GET /api/workspaces/{workspace_id}/files/{file_id}` - Get file
- `PUT /api/workspaces/{workspace_id}/files/{file_id}` - Update file
- `DELETE /api/workspaces/{workspace_id}/files/{file_id}` - Delete file

### Chats
- `GET /api/workspaces/{workspace_id}/chats` - List chats
- `POST /api/workspaces/{workspace_id}/chats` - Create chat
- `GET /api/workspaces/{workspace_id}/chats/{chat_id}` - Get chat
- `PUT /api/workspaces/{workspace_id}/chats/{chat_id}` - Update chat
- `DELETE /api/workspaces/{workspace_id}/chats/{chat_id}` - Delete chat

### Messages
- `GET /api/workspaces/{workspace_id}/chats/{chat_id}/messages` - Get messages
- `POST /api/workspaces/{workspace_id}/chats/{chat_id}/messages` - Send message

## Database Schema

The application uses PostgreSQL with the following main tables:

- `workspaces` - Project workspaces
- `files` - File metadata records
- `chats` - Chat sessions
- `chat_messages` - Individual messages

Run `make db-migrate` to apply migrations.

## Development Notes

### Database Connection

The API gracefully handles missing database connections:
- If PostgreSQL is unavailable, API returns mock data for read operations
- Write operations return 503 Service Unavailable
- This allows frontend development without a full database setup

### RAG Implementation

Currently, the system includes:
- Directive parser stub in `packages/rag-core`
- Message sending returns dummy assistant responses
- RAG logic (embeddings, vector search, etc.) will be implemented in future phases

### Testing

Run tests with:
```bash
make test
# or: pnpm run test
```

Currently includes directive parser tests.

## Contributing

1. Follow the existing code style
2. Run `make lint && make format` before committing
3. Add tests for new functionality
4. Update documentation as needed

## License

[Add your license here]