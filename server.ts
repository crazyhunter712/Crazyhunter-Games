import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.static("public"));

  // API Routes
  app.get("/api/test", (req, res) => {
    res.json({ message: "API is working", time: new Date().toISOString() });
  });

  app.get("/api/games", (req, res) => {
    console.log('Fetching games from API...');
    try {
      const gamesPath = path.join(process.cwd(), "src", "games.json");
      console.log('Reading games from:', gamesPath);
      if (!fs.existsSync(gamesPath)) {
        console.error('games.json NOT FOUND at:', gamesPath);
        return res.status(404).json({ error: "games.json not found" });
      }
      const games = JSON.parse(fs.readFileSync(gamesPath, "utf-8"));
      console.log('Loaded games from file:', games.length);
      res.json(games);
    } catch (error) {
      console.error('Failed to fetch games from API:', error);
      res.status(500).json({ error: "Failed to fetch games", details: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
