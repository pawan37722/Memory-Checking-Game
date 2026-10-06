// Local API server: mounts the exact same handlers in ./api that Vercel runs
// as serverless functions, so frontend + backend can be tested from one folder.
require("dotenv").config();
const path = require("path");
const fs = require("fs");
const express = require("express");

const app = express();
app.use(express.json({ limit: "60mb" }));

const API_DIR = path.join(__dirname, "..", "api");

function mount(dir, prefix) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith("_")) continue; // helpers, not routes
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      mount(full, `${prefix}/${entry.name}`);
    } else if (entry.name.endsWith(".js")) {
      const route = `${prefix}/${entry.name.replace(/\.js$/, "")}`;
      app.all(route, require(full));
      console.log(`  route  ${route}`);
    }
  }
}

console.log("Mounting API routes:");
mount(API_DIR, "/api");

// `npm start` after `npm run build` also serves the built React app.
const dist = path.join(__dirname, "..", "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*", (req, res) => res.sendFile(path.join(dist, "index.html")));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`));
