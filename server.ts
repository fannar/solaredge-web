import express from "express";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

const SOURCE_URL =
  process.env.SOLAREDGE_URL || "http://localhost:8080/api/v1/solaredge";

app.get("/api", async (_req, res) => {
  try {
    const upstream = await fetch(SOURCE_URL, {
      signal: AbortSignal.timeout(10000),
    });
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(502).json({
      success: false,
      error: "Failed to fetch upstream",
      detail: message,
    });
  }
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
