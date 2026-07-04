// server.ts
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();
var pool = null;
var DB_ENABLED = process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME;
if (DB_ENABLED) {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    charset: "utf8mb4"
  });
  console.log("\u2705 MySQL pool created for database:", process.env.DB_NAME);
} else {
  console.warn(
    "\u26A0\uFE0F  DB env vars not set \u2014 running without MySQL. Data saved to localStorage only."
  );
}
async function initDB() {
  if (!pool) return;
  const conn = await pool.getConnection();
  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS tenant_data (
        company_id   VARCHAR(100)  NOT NULL,
        entity_type  VARCHAR(100)  NOT NULL,
        data         LONGTEXT      NOT NULL DEFAULT '[]',
        updated_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
                                   ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (company_id, entity_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS global_users (
        id           VARCHAR(50)  PRIMARY KEY,
        data         LONGTEXT     NOT NULL,
        updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("\u2705 Database tables ready");
  } finally {
    conn.release();
  }
}
async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3e3);
  app.use(express.json({ limit: "10mb" }));
  app.get("/api/health", async (_req, res) => {
    let dbStatus = "disabled";
    if (pool) {
      try {
        await pool.execute("SELECT 1");
        dbStatus = "connected";
      } catch {
        dbStatus = "error";
      }
    }
    res.json({ status: "ok", db: dbStatus });
  });
  app.get("/api/data/:companyId/:entity", async (req, res) => {
    if (!pool) return res.json(null);
    const { companyId, entity } = req.params;
    try {
      const [rows] = await pool.execute(
        "SELECT data FROM tenant_data WHERE company_id = ? AND entity_type = ?",
        [companyId, entity]
      );
      if (rows.length === 0) return res.json(null);
      res.json(JSON.parse(rows[0].data));
    } catch (err) {
      console.error("GET /api/data error:", err);
      res.status(500).json({ error: "DB read failed" });
    }
  });
  app.put("/api/data/:companyId/:entity", async (req, res) => {
    if (!pool) return res.json({ ok: true, persisted: false });
    const { companyId, entity } = req.params;
    try {
      const serialized = JSON.stringify(req.body);
      await pool.execute(
        `INSERT INTO tenant_data (company_id, entity_type, data)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = NOW()`,
        [companyId, entity, serialized]
      );
      res.json({ ok: true, persisted: true });
    } catch (err) {
      console.error("PUT /api/data error:", err);
      res.status(500).json({ error: "DB write failed" });
    }
  });
  app.get("/api/users", async (_req, res) => {
    if (!pool) return res.json(null);
    try {
      const [rows] = await pool.execute(
        "SELECT data FROM global_users LIMIT 1"
      );
      if (rows.length === 0) return res.json(null);
      res.json(JSON.parse(rows[0].data));
    } catch (err) {
      console.error("GET /api/users error:", err);
      res.status(500).json({ error: "DB read failed" });
    }
  });
  app.put("/api/users", async (req, res) => {
    if (!pool) return res.json({ ok: true, persisted: false });
    try {
      const serialized = JSON.stringify(req.body);
      await pool.execute(
        `INSERT INTO global_users (id, data) VALUES ('__global__', ?)
         ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = NOW()`,
        [serialized]
      );
      res.json({ ok: true });
    } catch (err) {
      console.error("PUT /api/users error:", err);
      res.status(500).json({ error: "DB write failed" });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  await initDB();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\u{1F680} DEINRIM OMS running on http://localhost:${PORT}`);
    console.log(`   Mode: ${process.env.NODE_ENV || "development"}`);
  });
}
startServer().catch(console.error);
//# sourceMappingURL=server.js.map
