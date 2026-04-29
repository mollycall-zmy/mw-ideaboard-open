# Ideaboard

Ideaboard is a lightweight visual inspiration board built with React, Express, and PostgreSQL. It supports image/video uploads, tags, notes, source links, monthly browsing, and a simple admin-protected editing workflow.

Ideaboard 是一个轻量级图片 / 视频灵感板项目，适合个人创意库、素材收藏、内容策划和视觉参考管理。

## Features

- Upload images and videos into a visual masonry board.
- Add source links, custom tags, and MW Idea / notes for each item.
- Browse entries by month and view a simple monthly summary.
- Preview videos on hover and open full item details in a modal.
- Use an admin key to protect upload, edit, delete, and media replacement actions.
- Optionally call a compatible vision model API to generate tags for uploaded images.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Framer Motion, lucide-react
- Backend: Node.js, Express, Multer
- Database: PostgreSQL with Drizzle ORM

## Local Setup

Install frontend dependencies:

```bash
cd frontend
npm install
```

Install backend dependencies:

```bash
cd backend
npm install
```

Create a backend environment file:

```bash
cp ../.env.example .env
```

Start the backend:

```bash
cd backend
node index.js
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

By default, the frontend calls `/api/images` and `/uploads`. In local development, configure your Vite proxy or serve both apps behind the same origin if needed.

## Environment Variables

Create `backend/.env` from `.env.example`.

```env
DATABASE_URL=postgresql://user:password@localhost:5432/ideaboard
MW_ADMIN_KEY=change-me
MIMO_API_KEY=your-ai-api-key
MIMO_BASE_URL=https://example.com/v1
MIMO_MODEL=your-model-name
```

- `DATABASE_URL`: PostgreSQL connection string.
- `MW_ADMIN_KEY`: shared admin key sent by the frontend in the `x-mw-admin-key` header.
- `MIMO_API_KEY`: optional API key for AI image tagging.
- `MIMO_BASE_URL`: optional OpenAI-compatible API base URL.
- `MIMO_MODEL`: optional model name for AI image tagging.

If `MIMO_API_KEY` is empty, uploads still work and AI tagging is skipped.

## Database Initialization

The database schema is defined in `backend/db/schema.js`.

One simple setup path is to create the table manually:

```sql
CREATE TABLE IF NOT EXISTS ideaboard (
  id SERIAL PRIMARY KEY,
  image_url TEXT NOT NULL,
  ai_tags JSON DEFAULT '[]',
  source_link TEXT,
  mw_idea TEXT,
  rotation REAL NOT NULL,
  decoration VARCHAR(50) NOT NULL,
  dec_position REAL NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

You can also use Drizzle Kit with `backend/drizzle.config.js` if you prefer migration-based workflows.

## Upload Directory

Uploaded media is stored in `backend/uploads`.

The repository keeps only `backend/uploads/.gitkeep`. Real uploaded images and videos are ignored by Git and should be backed up separately in production.

## Admin Workflow

Double-click the footer text in the app to enter the admin key. The key is stored in `sessionStorage` and sent with protected API requests as `x-mw-admin-key`.

Admin mode enables:

- Uploading new media.
- Editing tags, source links, and notes.
- Replacing an item's media file.
- Deleting items.

## Development Commands

Frontend:

```bash
cd frontend
npm run dev
npm run build
npm run preview
npm run lint
```

Backend:

```bash
cd backend
node index.js
npx drizzle-kit generate
```

## Deployment Notes

- Set environment variables through your hosting provider or server environment.
- Keep `backend/.env` and uploaded media out of Git.
- Serve `backend/uploads` as static files or move media storage to object storage for larger deployments.
- Put the Express API and Vite-built frontend behind the same domain or configure a reverse proxy/CORS policy.
- Use HTTPS and a strong `MW_ADMIN_KEY` before exposing the app publicly.

## License

MIT
