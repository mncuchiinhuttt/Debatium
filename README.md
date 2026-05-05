# Debatium

Debatium is an AI-powered debating platform designed for competitive and practice debating. It leverages advanced AI models to provide a challenging and interactive experience for debaters of all levels.

## 🚀 Key Features

- **AI Debater**: Face off against intelligent AI opponents. Supports multiple languages, including **English** and **Vietnamese** (powered by Valsea).
- **Collaborative Sparring**: Invite friends to private "spars" and debate together in a shared session.
- **Text-to-Speech (TTS)**: Experience immersive debates with real-time AI voice responses.
- **Session Management**: Track your debate history, profile, and upcoming calendar events.
- **Modern UI**: Built with Svelte 5, Tailwind CSS 4, and Lucide Svelte for a premium, responsive experience.

## 🛠️ Tech Stack

- **Framework**: [SvelteKit](https://kit.svelte.dev/) (Svelte 5)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [Neon](https://neon.tech/) (PostgreSQL) with [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [Better-Auth](https://www.better-auth.com/)
- **AI Integration**: [Vercel AI SDK](https://sdk.vercel.ai/), OpenAI, and Valsea.
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: [Bits UI](https://www.bits-ui.com/), Mode Watcher, Lucide Svelte.

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)
- A Neon PostgreSQL database instance.

### Installation

1.  **Clone the repository**:
    ```sh
    git clone https://github.com/your-username/debatium.git
    cd Debatium
    ```

2.  **Install dependencies**:
    ```sh
    npm install
    ```

3.  **Environment Variables**:
    Create a `.env` file in the root directory and add the necessary environment variables (refer to `.env.example` if available).
    ```env
    DATABASE_URL=your_neon_db_url
    BETTER_AUTH_SECRET=your_auth_secret
    OPENAI_API_KEY=your_openai_key
    # Add other necessary keys here
    ```

### Development

Start the development server:

```sh
npm run dev
```

The app will be available at `http://localhost:5173`.

## 📦 Available Scripts

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Creates a production build of the application (runs `db:init`, so `DATABASE_URL` must be set).
- `npm run preview`: Previews the production build locally.
- `npm run check`: Runs SvelteKit sync and `svelte-check`.
- `npm run lint`: Checks for linting and formatting issues.
- `npm run format`: Automatically formats the codebase with Prettier.
- `npm run db:init`: Initializes/pushes the database schema in force mode for deployments.
- `npm run db:push`: Pushes schema changes to the database via Drizzle.
- `npm run db:studio`: Opens Drizzle Studio to explore your database.

---

Built with ❤️ by the Debatium Team.
