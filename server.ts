import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMMENTS_FILE = path.join(__dirname, "src", "comments.json");
const PROFILES_FILE = path.join(__dirname, "src", "profiles.json");

// Ensure files exist
if (!fs.existsSync(COMMENTS_FILE)) {
  fs.writeFileSync(COMMENTS_FILE, JSON.stringify([]));
}
if (!fs.existsSync(PROFILES_FILE)) {
  fs.writeFileSync(PROFILES_FILE, JSON.stringify({}));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/profile/:username", (req, res) => {
    try {
      const profiles = JSON.parse(fs.readFileSync(PROFILES_FILE, "utf-8"));
      const profile = profiles[req.params.username] || {
        playtime: 0,
        favorites: [],
        playedGames: [],
        ratings: {}
      };
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.post("/api/profile/:username", (req, res) => {
    try {
      const { username } = req.params;
      const { playtime, favorites, playedGames, ratings } = req.body;
      
      const profiles = JSON.parse(fs.readFileSync(PROFILES_FILE, "utf-8"));
      profiles[username] = {
        playtime: playtime || 0,
        favorites: favorites || [],
        playedGames: playedGames || [],
        ratings: ratings || {}
      };

      fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2));
      res.json({ status: "ok" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.get("/api/comments/:gameId", (req, res) => {
    try {
      const comments = JSON.parse(fs.readFileSync(COMMENTS_FILE, "utf-8"));
      const gameComments = comments.filter((c: any) => c.gameId === req.params.gameId);
      res.json(gameComments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/comments", (req, res) => {
    try {
      const { gameId, author, text, rating } = req.body;
      if (!gameId || !author || !text) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const comments = JSON.parse(fs.readFileSync(COMMENTS_FILE, "utf-8"));
      const newComment = {
        id: Date.now().toString(),
        gameId,
        author,
        text,
        rating: rating || 0,
        date: new Date().toISOString(),
      };

      comments.push(newComment);
      fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2));
      res.status(201).json(newComment);
    } catch (error) {
      res.status(500).json({ error: "Failed to post comment" });
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
