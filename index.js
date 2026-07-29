import express from "express";
import bodyParser from "body-parser";
import methodOverride from "method-override";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// ── PostgreSQL Pool ────────────────────────────────────────────────────────────
const db = new pg.Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
});

// Auto-create the `blogs` table if it does not exist
async function initDb() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS blogs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Connected to PostgreSQL & 'blogs' table is ready.");
  } catch (err) {
    console.error("❌ Database initialization error:", err.message);
  }
}

initDb();

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(methodOverride("_method"));

// ── Routes ─────────────────────────────────────────────────────────────────────

// Home – show the write form
app.get("/", (req, res) => {
  res.render("index.ejs", { blogs: null, editMode: null });
});

// List all blogs
app.get("/blogs", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM blogs ORDER BY created_at DESC"
    );
    res.render("blogs.ejs", { blogs: result.rows });
  } catch (err) {
    console.error("Error fetching blogs:", err.message);
    res.status(500).send(`Internal Server Error: ${err.message}`);
  }
});

// Create a new blog
app.post("/submit", async (req, res) => {
  const { title, textbox } = req.body;
  try {
    await db.query("INSERT INTO blogs (title, text) VALUES ($1, $2)", [
      title,
      textbox,
    ]);
    console.log("Blog created:", { title, text: textbox });
    res.redirect("/blogs");
  } catch (err) {
    console.error("Error creating blog:", err.message);
    res.status(500).send(`Internal Server Error: ${err.message}`);
  }
});

// View a single blog
app.get("/blogs/:id", async (req, res) => {
  const blogId = req.params.id;
  try {
    const result = await db.query("SELECT * FROM blogs WHERE id = $1", [
      blogId,
    ]);
    const blog = result.rows[0];
    if (blog) {
      res.render("template.ejs", { blog, blogId });
    } else {
      res.status(404).send("Blog not found");
    }
  } catch (err) {
    console.error("Error fetching blog:", err.message);
    res.status(500).send(`Internal Server Error: ${err.message}`);
  }
});

// Show edit form
app.get("/blogs/:id/edit", async (req, res) => {
  const blogId = req.params.id;
  try {
    const result = await db.query("SELECT * FROM blogs WHERE id = $1", [
      blogId,
    ]);
    const blog = result.rows[0];
    if (blog) {
      res.render("index.ejs", { blog, blogId, editMode: true });
    } else {
      res.status(404).send("Blog not found");
    }
  } catch (err) {
    console.error("Error fetching blog for edit:", err.message);
    res.status(500).send(`Internal Server Error: ${err.message}`);
  }
});

// Update a blog
app.post("/blogs/:id/submit", async (req, res) => {
  const blogId = req.params.id;
  const { title, textbox } = req.body;
  try {
    await db.query("UPDATE blogs SET title = $1, text = $2 WHERE id = $3", [
      title,
      textbox,
      blogId,
    ]);
    res.redirect(`/blogs/${blogId}`);
  } catch (err) {
    console.error("Error updating blog:", err.message);
    res.status(500).send(`Internal Server Error: ${err.message}`);
  }
});

// Delete a blog
app.delete("/blogs/:id/delete", async (req, res) => {
  const blogId = req.params.id;
  try {
    await db.query("DELETE FROM blogs WHERE id = $1", [blogId]);
    res.redirect("/blogs");
  } catch (err) {
    console.error("Error deleting blog:", err.message);
    res.status(500).send(`Internal Server Error: ${err.message}`);
  }
});

// ── Start server ───────────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});