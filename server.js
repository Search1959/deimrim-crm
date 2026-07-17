// server.ts
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import multer from "multer";
import * as XLSX from "xlsx";
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
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
  app.post("/api/stock/import/:companyId", upload.single("file"), async (req, res) => {
    if (!pool) return res.status(503).json({ error: "DB not available" });
    const { companyId } = req.params;
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    try {
      const wb = XLSX.read(req.file.buffer, { type: "buffer" });
      const isDescCol = (s) => /desc|name|product|item/i.test(s);
      const isHsnCol = (s) => /hsn/i.test(s);
      const isRateCol = (s) => /rate|price/i.test(s);
      const isUnitCol = (s) => /unit/i.test(s);
      const isQtyCol = (s) => /clos|stock|qty|quant/i.test(s);
      const allRows = [];
      for (const sheetName of wb.SheetNames) {
        const raw = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: "" });
        if (raw.length < 2) continue;
        let headerIdx = -1;
        for (let i = 0; i < Math.min(raw.length, 10); i++) {
          const cells = raw[i].map((c) => String(c));
          if (cells.some(isDescCol) && cells.some(isQtyCol)) {
            headerIdx = i;
            break;
          }
        }
        if (headerIdx === -1) {
          for (let i = 0; i < Math.min(raw.length, 10); i++) {
            const cells = raw[i].map((c) => String(c));
            if (cells.some(isHsnCol) && cells.some(isQtyCol)) {
              headerIdx = i;
              break;
            }
          }
        }
        if (headerIdx === -1) {
          const cols = raw[0].map((c) => String(c));
          if (cols.some(isQtyCol)) headerIdx = 0;
        }
        if (headerIdx === -1) continue;
        const headers = raw[headerIdx].map((c) => String(c).trim());
        const descIdx = headers.findIndex(isDescCol);
        const hsnIdx = headers.findIndex(isHsnCol);
        const rateIdx = headers.findIndex(isRateCol);
        const unitIdx = headers.findIndex(isUnitCol);
        const qtyIdx = headers.findIndex(isQtyCol);
        const fallbackDescIdx = descIdx === -1 ? 1 : descIdx;
        for (let r = headerIdx + 1; r < raw.length; r++) {
          const row = raw[r];
          const desc = String(row[fallbackDescIdx] ?? "").trim();
          const hsn = hsnIdx >= 0 ? String(row[hsnIdx] ?? "").trim() : "";
          const rate = rateIdx >= 0 ? parseFloat(String(row[rateIdx] ?? 0)) || 0 : 0;
          const unit = unitIdx >= 0 ? String(row[unitIdx] ?? "Nos").trim() || "Nos" : "Nos";
          const qty = qtyIdx >= 0 ? parseFloat(String(row[qtyIdx] ?? 0)) || 0 : 0;
          if (desc) allRows.push({ description: desc, hsn, rate, unit, qty });
        }
      }
      const getEntity = async (entity) => {
        const [rows] = await pool.execute(
          "SELECT data FROM tenant_data WHERE company_id = ? AND entity_type = ?",
          [companyId, entity]
        );
        return rows.length ? JSON.parse(rows[0].data) : [];
      };
      const saveEntity = async (entity, data) => {
        await pool.execute(
          `INSERT INTO tenant_data (company_id, entity_type, data)
           VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = NOW()`,
          [companyId, entity, JSON.stringify(data)]
        );
      };
      const clearFirst = req.query.clear === "true";
      const products = clearFirst ? [] : await getEntity("products");
      const batchStocks = clearFirst ? [] : await getEntity("batchStocks");
      let updated = 0, added = 0, skipped = 0;
      for (const { description, hsn, rate, unit, qty } of allRows) {
        if (!description) {
          skipped++;
          continue;
        }
        if (!hsn && rate === 0 && qty === 0) {
          skipped++;
          continue;
        }
        let existing = hsn ? products.find((p) => p.hsnCode && String(p.hsnCode).trim() === hsn) : null;
        if (!existing) {
          existing = products.find(
            (p) => p.name && p.name.trim().toLowerCase() === description.toLowerCase()
          );
        }
        if (existing) {
          const bs = batchStocks.find((b) => b.productId === existing.id);
          if (bs) {
            bs.quantity = qty;
          } else {
            batchStocks.push({ id: `bs-${existing.id}`, productId: existing.id, batchNumber: "STOCK", quantity: qty, unit, purchasePrice: 0, expiryDate: "", location: "", createdAt: (/* @__PURE__ */ new Date()).toISOString() });
          }
          updated++;
        } else {
          const newId = `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          products.push({ id: newId, name: description, hsnCode: hsn, unit, sellingPrice: rate, purchasePrice: 0, category: "Water Treatment", minStockLevel: 0, createdAt: (/* @__PURE__ */ new Date()).toISOString() });
          batchStocks.push({ id: `bs-${newId}`, productId: newId, batchNumber: "STOCK", quantity: qty, unit, purchasePrice: 0, expiryDate: "", location: "", createdAt: (/* @__PURE__ */ new Date()).toISOString() });
          added++;
        }
      }
      await saveEntity("products", products);
      await saveEntity("batchStocks", batchStocks);
      res.json({ ok: true, updated, added, skipped, total: allRows.length });
    } catch (err) {
      console.error("POST /api/stock/import error:", err);
      res.status(500).json({ error: String(err) });
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
