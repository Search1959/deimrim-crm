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
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS services_tenants (
        id          VARCHAR(50)   PRIMARY KEY,
        name        VARCHAR(255)  NOT NULL,
        type        VARCHAR(50)   DEFAULT 'general',
        owner_name  VARCHAR(255)  DEFAULT '',
        email       VARCHAR(255)  DEFAULT '',
        phone       VARCHAR(100)  DEFAULT '',
        address     TEXT          DEFAULT '',
        gstin       VARCHAR(50)   DEFAULT '',
        state       VARCHAR(100)  DEFAULT '',
        plan        VARCHAR(20)   DEFAULT 'free',
        active      TINYINT(1)    DEFAULT 1,
        created_at  VARCHAR(50)   DEFAULT ''
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS services_users (
        id          VARCHAR(50)   PRIMARY KEY,
        tenant_id   VARCHAR(50)   DEFAULT 'SYSTEM',
        name        VARCHAR(255)  NOT NULL,
        email       VARCHAR(255)  NOT NULL,
        password    VARCHAR(255)  DEFAULT '',
        role        VARCHAR(50)   DEFAULT 'TENANT_ADMIN',
        created_at  VARCHAR(50)   DEFAULT '',
        UNIQUE KEY uq_email (email)
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
  // -- Services: dedicated tenant + user tables (MySQL-primary, no localStorage dependency) --
  // Tables created in initDB() below

  // GET all tenants
  app.get("/api/services/tenants", async (_req, res) => {
    if (!pool) return res.json([]);
    try {
      const [rows] = await pool.execute("SELECT * FROM services_tenants ORDER BY created_at DESC");
      res.json(rows);
    } catch (err) { console.error("GET services_tenants:", err); res.json([]); }
  });

  // POST create tenant
  app.post("/api/services/tenants", async (req, res) => {
    if (!pool) return res.status(503).json({ error: "DB not available" });
    const t = req.body;
    try {
      await pool.execute(
        `INSERT INTO services_tenants (id,name,type,owner_name,email,phone,address,gstin,state,plan,active,created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE
         name=VALUES(name),type=VALUES(type),owner_name=VALUES(owner_name),email=VALUES(email),
         phone=VALUES(phone),address=VALUES(address),gstin=VALUES(gstin),state=VALUES(state),
         plan=VALUES(plan),active=VALUES(active)`,
        [t.id, t.name, t.type, t.ownerName||"", t.email||"", t.phone||"", t.address||"",
         t.gstin||"", t.state||"", t.plan||"free", t.active?1:0, t.createdAt||new Date().toISOString()]
      );
      res.json({ ok: true });
    } catch (err) { console.error("POST services_tenants:", err); res.status(500).json({ error: String(err) }); }
  });

  // PUT update tenant
  app.put("/api/services/tenants/:id", async (req, res) => {
    if (!pool) return res.status(503).json({ error: "DB not available" });
    const t = req.body;
    try {
      await pool.execute(
        `UPDATE services_tenants SET name=?,type=?,owner_name=?,email=?,phone=?,address=?,gstin=?,state=?,plan=?,active=?
         WHERE id=?`,
        [t.name, t.type, t.ownerName||"", t.email||"", t.phone||"", t.address||"",
         t.gstin||"", t.state||"", t.plan||"free", t.active?1:0, req.params.id]
      );
      res.json({ ok: true });
    } catch (err) { console.error("PUT services_tenants:", err); res.status(500).json({ error: String(err) }); }
  });

  // DELETE tenant
  app.delete("/api/services/tenants/:id", async (req, res) => {
    if (!pool) return res.status(503).json({ error: "DB not available" });
    try {
      await pool.execute("DELETE FROM services_tenants WHERE id=?", [req.params.id]);
      await pool.execute("DELETE FROM services_users WHERE tenant_id=?", [req.params.id]);
      res.json({ ok: true });
    } catch (err) { console.error("DELETE services_tenants:", err); res.status(500).json({ error: String(err) }); }
  });

  // GET all service users
  app.get("/api/services/users", async (_req, res) => {
    if (!pool) return res.json([]);
    try {
      const [rows] = await pool.execute("SELECT * FROM services_users ORDER BY created_at DESC");
      res.json(rows.map(r => ({ id: r.id, tenantId: r.tenant_id, name: r.name, email: r.email, password: r.password, role: r.role })));
    } catch (err) { console.error("GET services_users:", err); res.json([]); }
  });

  // POST create / upsert user
  app.post("/api/services/users", async (req, res) => {
    if (!pool) return res.status(503).json({ error: "DB not available" });
    const u = req.body;
    try {
      await pool.execute(
        `INSERT INTO services_users (id,tenant_id,name,email,password,role,created_at)
         VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE
         tenant_id=VALUES(tenant_id),name=VALUES(name),email=VALUES(email),
         password=VALUES(password),role=VALUES(role)`,
        [u.id, u.tenantId||"SYSTEM", u.name, u.email, u.password||"", u.role, new Date().toISOString()]
      );
      res.json({ ok: true });
    } catch (err) { console.error("POST services_users:", err); res.status(500).json({ error: String(err) }); }
  });

  // PUT update user
  app.put("/api/services/users/:id", async (req, res) => {
    if (!pool) return res.status(503).json({ error: "DB not available" });
    const u = req.body;
    try {
      await pool.execute(
        "UPDATE services_users SET name=?,email=?,password=?,role=? WHERE id=?",
        [u.name, u.email, u.password||"", u.role, req.params.id]
      );
      res.json({ ok: true });
    } catch (err) { console.error("PUT services_users:", err); res.status(500).json({ error: String(err) }); }
  });

  // DELETE user
  app.delete("/api/services/users/:id", async (req, res) => {
    if (!pool) return res.status(503).json({ error: "DB not available" });
    try {
      await pool.execute("DELETE FROM services_users WHERE id=?", [req.params.id]);
      res.json({ ok: true });
    } catch (err) { console.error("DELETE services_users:", err); res.status(500).json({ error: String(err) }); }
  });

  // Login check endpoint for /services
  app.post("/api/services/login", async (req, res) => {
    if (!pool) return res.status(503).json({ error: "DB not available" });
    const { email, password } = req.body;
    try {
      const [rows] = await pool.execute(
        "SELECT u.*, t.name as tenant_name FROM services_users u LEFT JOIN services_tenants t ON u.tenant_id=t.id WHERE u.email=? AND u.password=?",
        [email, password]
      );
      if (rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });
      const u = rows[0];
      res.json({ id: u.id, tenantId: u.tenant_id, name: u.name, email: u.email, role: u.role, tenantName: u.tenant_name });
    } catch (err) { console.error("POST services/login:", err); res.status(500).json({ error: String(err) }); }
  });

  app.get("/help", (_req, res) => {
    res.sendFile(path.join(process.cwd(), "public", "help.html"));
  });
  const servicesPath = path.join(process.cwd(), "services-dist");
  app.use("/services", express.static(servicesPath));
  app.get("/services/*", (_req, res) => {
    res.sendFile(path.join(servicesPath, "index.html"));
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
