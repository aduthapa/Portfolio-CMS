// Custom Next.js production server. This is the cPanel "Application
// startup file" (Setup Node.js App), replacing dist/server.js — same
// contract as the old Express entry point: never hardcode the port,
// Passenger injects it via process.env.PORT (see README's "Deploying to
// cPanel" section).
const { createServer } = require("http");
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev: process.env.NODE_ENV !== "production" });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => handle(req, res)).listen(port, () => {
      console.log(`Next.js server listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start Next.js server:", err);
    process.exit(1);
  });
