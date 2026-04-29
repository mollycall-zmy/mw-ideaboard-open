[中文说明](README.zh-CN.md)

# MW Ideaboard Open

A lightweight visual inspiration board for collecting images, videos, tags, notes, and source links.

It is designed for creators, marketers, content planners, designers, and anyone who needs a simple place to save visual references and creative ideas.

Think of it as a clean, personal creative archive, not a heavy CMS, not a complex admin dashboard, but a focused ideaboard for collecting and revisiting inspiration.

---

## Who is this for?

This project is useful if you often collect:

- Visual references
- Social media content ideas
- Campaign inspiration
- Advertising examples
- Brand and design references
- Short videos and image materials
- Notes, tags, and source links

Ideaboard helps you turn scattered inspiration into a structured, browsable archive.

---

## Features

- Image and video upload
- Masonry-style visual board
- Tag management
- Source link tracking
- Notes / creative thinking field
- Monthly browsing
- Monthly summary entry
- Simple admin mode
- Admin-protected upload, edit, and delete
- Replace uploaded media while editing
- Video hover preview
- Lazy loading for images
- Metadata preload for videos
- Basic cache control for media and API responses

---

## Tech Stack

### Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React

### Backend

- Node.js
- Express
- Multer
- PostgreSQL
- Drizzle ORM

---

## Project Structure

```txt
.
├── backend
│   ├── db
│   │   └── schema.js
│   ├── uploads
│   │   └── .gitkeep
│   ├── index.js
│   ├── drizzle.config.js
│   ├── package.json
│   └── package-lock.json
│
├── frontend
│   ├── public
│   ├── src
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.ts
│   ├── package.json
│   └── package-lock.json
│
├── .env.example
├── .gitignore
├── LICENSE
└── README.md
```

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/your-username/mw-ideaboard-open.git
cd mw-ideaboard-open
```

### 2. Configure backend environment variables

Copy the example environment file:

```bash
cp .env.example backend/.env
```

Then update the values:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/ideaboard
MW_ADMIN_KEY=change-me
MIMO_API_KEY=your-ai-api-key
MIMO_BASE_URL=https://example.com/v1
MIMO_MODEL=your-model-name
```

Explanation:

- `DATABASE_URL`: PostgreSQL connection string
- `MW_ADMIN_KEY`: admin key for upload, edit, and delete actions
- `MIMO_API_KEY`: optional AI tagging API key
- `MIMO_BASE_URL`: optional AI API base URL
- `MIMO_MODEL`: optional AI model name

If you do not need AI tagging at the beginning, you can keep placeholder values and customize the logic later.

### 3. Install and start the backend

```bash
cd backend
npm install
node index.js
```

The backend runs on:

```txt
http://localhost:3000
```

### 4. Install and start the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend usually runs on:

```txt
http://localhost:5173
```

If port 5173 is already in use, Vite may switch to another port such as 5174. Use the URL shown in your terminal.

---

## Database

This project uses PostgreSQL to store ideaboard records, including:

- Image or video URL
- Tags
- Source link
- Creative notes
- Created time
- Decoration metadata
- Display-related fields

Uploaded media files are not stored in the database. The database only stores file paths such as:

```txt
/uploads/example.jpg
```

The actual files are saved in:

```txt
backend/uploads
```

---

## Upload Storage

Uploaded images and videos are stored in:

```txt
backend/uploads
```

The open-source repository only keeps:

```txt
backend/uploads/.gitkeep
```

Real uploaded media files are ignored by Git.

If you deploy this project, make sure to back up both:

- PostgreSQL database
- `backend/uploads`

---

## Admin Mode

Ideaboard includes a simple admin-protected workflow.

Visitors can browse public content. Upload, edit, and delete actions require admin verification.

Default flow:

1. Double-click the footer copyright area
2. Enter the admin key
3. Enter admin mode
4. Upload / edit / delete requests include the admin key
5. The backend validates the key with `MW_ADMIN_KEY`

Configure the admin key in `backend/.env`:

```env
MW_ADMIN_KEY=change-me
```

This is a lightweight protection mechanism, not a full user authentication system.

---

## Common Commands

Start backend:

```bash
cd backend
node index.js
```

Start frontend:

```bash
cd frontend
npm run dev
```

Build frontend:

```bash
cd frontend
npm run build
```

Preview frontend build:

```bash
cd frontend
npm run preview
```

---

## Deployment Notes

You can deploy this project to any environment that supports Node.js and PostgreSQL.

A common setup:

- Build frontend with Vite
- Serve `frontend/dist` as static files
- Run backend with Node.js
- Use PostgreSQL as the database
- Keep uploaded files in `backend/uploads`
- Use a reverse proxy if needed

For public usage, it is recommended to:

- Back up your PostgreSQL database regularly
- Back up `backend/uploads`
- Never commit `.env`
- Never commit real uploaded media files

---

## Security Notes

Do not commit:

- `.env`
- `backend/.env`
- Database credentials
- API keys
- Passwords
- Real uploaded images or videos
- Private brand assets
- Unlicensed fonts

Use `.env.example` as the configuration template.

---

## Roadmap

Possible future improvements:

- Backend pagination and "Load more"
- Video poster / cover image support
- Improved AI tagging
- Tag filtering
- Search
- Multi-user authentication
- Object storage support
- More complete admin dashboard

---

## License

MIT License

You are free to learn from, use, and modify this project.

This open-source version does not include any proprietary brand assets, private fonts, production deployment records, or real uploaded media.
