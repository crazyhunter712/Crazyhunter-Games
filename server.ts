import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMMENTS_FILE = path.join(__dirname, "src", "comments.json");

// Ensure files exist
if (!fs.existsSync(COMMENTS_FILE)) {
  fs.writeFileSync(COMMENTS_FILE, JSON.stringify([]));
}

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
    console.log('POST /api/comments received:', req.body);
    try {
      const { gameId, author, text, rating } = req.body;
      if (!gameId || !author || !text) {
        console.warn('Missing fields:', { gameId, author, text });
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (!fs.existsSync(COMMENTS_FILE)) {
        fs.writeFileSync(COMMENTS_FILE, JSON.stringify([]));
      }

      const fileContent = fs.readFileSync(COMMENTS_FILE, "utf-8");
      const comments = JSON.parse(fileContent || "[]");
      
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
      console.log('Comment saved successfully:', newComment.id);
      res.status(201).json(newComment);
    } catch (error) {
      console.error('Failed to post comment:', error);
      res.status(500).json({ error: "Failed to post comment", details: error.message });
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
