# Portfolio CMS

A content management system for talent agencies, managers, and studios to
showcase the **celebrities, influencers, and artists** they represent —
public profile pages with galleries, press, awards, events, testimonials,
and a booking/inquiry form, plus a full admin dashboard to manage it all.

Built **without PHP**, for hosts (like cPanel) that offer a "Setup Node.js
App" tool alongside the usual PHP stack.

## Why Node.js (not Python or Ruby)

cPanel's Software panel offers three non-PHP application environments —
Node.js, Python, and Ruby — all run the same way under the hood, via
CloudLinux's Application Manager / Phusion Passenger. Node.js was chosen
here because:

- It has the deepest ecosystem for this kind of app: a first-class MySQL
  driver (`mysql2`), a mature ORM with MySQL migrations (`Prisma`), and a
  huge selection of well-maintained middleware (sessions, uploads, security
  headers).
- One runtime handles both the server-rendered site *and* the JSON/JS on
  the page — no second language to install or reason about.
- Passenger's Node.js support is the most battle-tested of the three on
  shared cPanel hosting, with predictable behavior around restarts, the
  injected `PORT`/socket, and `npm install`.

## Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js 18+ (TypeScript) |
| Web framework | Express |
| Views | Server-rendered EJS (public site + admin dashboard) |
| Database | MySQL, via Prisma ORM |
| Auth | Session-based (bcrypt password hashes, MySQL-backed session store) |
| File uploads | Multer, stored on disk under `public/uploads/` |

A single Express process serves everything — no separate frontend build or
hosting needed, which matches how cPanel's "Setup Node.js App" expects an
app to be structured (one startup file, one process, managed by Passenger).

## Features

**Public site**
- Homepage with featured talent and category browsing
- Searchable, filterable talent directory
- Profile pages: bio, photo/video portfolio gallery, press mentions,
  awards, events, testimonials, and a booking/contact form
- General contact page

**Admin dashboard** (`/admin`)
- Dashboard with key stats and recent activity
- Full profile CRUD: bio, category, SEO fields, avatar/cover image upload,
  tags, social links, draft/published/archived status, featured flag
- Portfolio gallery manager per profile: upload images/video, edit
  captions, drag-and-drop reordering
- Press, awards, events, and testimonials managers per profile
- Inquiries inbox with status tracking (new / in progress / resolved)
- Media library for reusable uploads (e.g. site logo)
- Site settings (name, tagline, brand color, logo, favicon, social links)
- Team management with Admin/Editor roles

## Project structure

```
prisma/schema.prisma   Database schema (MySQL)
prisma/seed.ts          Creates the first admin user + sample profile
src/app.ts               Express app wiring (middleware, routes)
src/server.ts             Entry point — what cPanel/Passenger runs
src/routes/               Route handlers (public + admin)
src/middleware/            Auth, uploads, error handling, view locals
views/                       EJS templates (public/ and admin/)
public/                       Static assets: css, js, and uploaded media
```

## Local development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in a local MySQL connection
   string (create an empty database first) and a session secret.
3. Create the database tables:
   ```bash
   npm run prisma:migrate:dev
   ```
4. Seed an admin user and a sample profile:
   ```bash
   npm run prisma:seed
   ```
5. Start the dev server (auto-restarts on file changes):
   ```bash
   npm run dev
   ```
6. Visit `http://localhost:3000` for the public site and
   `http://localhost:3000/admin/login` for the dashboard, using the
   `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from your `.env`.

## Deploying to cPanel

These steps assume a host with **"Setup Node.js App"** and **"MySQL
Databases"** in cPanel (as in the Software panel screenshot this project
was built from).

### 1. Create the MySQL database

In cPanel → **MySQL Databases**:
1. Create a database, e.g. `cpanelUser_portfolio`.
2. Create a database user with a strong password.
3. Add that user to the database with **All Privileges**.

Note the full database name and username — cPanel prefixes both with your
cPanel account name (e.g. `cpanelUser_portfolio`, `cpanelUser_dbuser`).

### 2. Upload the code

Either:
- **Git**: use cPanel's Git Version Control (or SSH) to clone this
  repository into the app's directory, or
- **Upload**: zip the project (excluding `node_modules/` and `.env`) and
  extract it via File Manager.

Pick a directory outside `public_html` (e.g. `portfolio-cms-app`) — the
Node.js app tool creates the public URL mapping for you, the app's own
files don't need to sit in the web root.

### 3. Create the Node.js application

In cPanel → **Setup Node.js App** → **Create Application**:
- **Node.js version**: 18.x or newer.
- **Application mode**: Production.
- **Application root**: the directory you uploaded to (e.g.
  `portfolio-cms-app`).
- **Application URL**: the domain or subdomain to serve it on.
- **Application startup file**: `dist/server.js`.

Click **Create**. cPanel will show you an "Enter to the virtual
environment" command and a **Run NPM Install** button — use the button
after setting environment variables below, or run
`npm install && npm run build` from the virtual environment's shell.

### 4. Set environment variables

Still on the Setup Node.js App page for this application, add these
**Environment Variables** (values from step 1 and your own settings):

| Key | Value |
|---|---|
| `DATABASE_URL` | `mysql://cpanelUser_dbuser:PASSWORD@localhost:3306/cpanelUser_portfolio` |
| `SESSION_SECRET` | a long random string (generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
| `NODE_ENV` | `production` |
| `SITE_URL` | `https://yourdomain.com` |
| `SEED_ADMIN_EMAIL` | the email for your first admin login |
| `SEED_ADMIN_PASSWORD` | a strong password (change it after first login) |
| `MAX_UPLOAD_MB` | `25` (or your preferred limit) |

Do **not** set `PORT` — cPanel/Passenger injects it automatically for
Node.js apps.

### 5. Install, migrate, and seed

From the "Setup Node.js App" page, click **Run NPM Install** (this also
triggers `npm run build` via the `postinstall`/`build` scripts if you wire
it into your deploy process — otherwise run the commands below manually).

Open the app's virtual environment shell (the command shown at the top of
the Setup Node.js App page, run via **Terminal** in cPanel or SSH), then:

```bash
npm install
npm run build
npm run prisma:migrate    # creates the database tables
npm run prisma:seed       # creates your first admin user
```

### 6. Start the app

Back in **Setup Node.js App**, click **Restart** (or **Start**) on the
application. cPanel/Passenger will run `node dist/server.js` and route
traffic from your configured domain to it.

Visit your domain to see the public site, and `/admin/login` to sign in
with the admin credentials from step 4.

### Updating the app later

After pushing new code (git pull or re-upload):
```bash
npm install
npm run build
npm run prisma:migrate     # if the schema changed
```
Then click **Restart** in Setup Node.js App.

## Security notes

- Change the seeded admin password immediately after first login (Team →
  edit your user).
- `SESSION_SECRET` must be a long random value in production — sessions
  are stored in MySQL, so restarts don't log users out, but a weak secret
  would let cookies be forged.
- Uploaded files are validated by MIME type and size (`MAX_UPLOAD_MB`)
  before being written to disk.
