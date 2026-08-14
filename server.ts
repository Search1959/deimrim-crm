import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import multer from "multer";
import * as XLSX from "xlsx";

dotenv.config();

// ---------------------------------------------------------------------------
// MySQL connection pool (gracefully disabled if DB env vars are not set)
// ---------------------------------------------------------------------------

let pool: mysql.Pool | null = null;

const DB_ENABLED =
  process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME;

if (DB_ENABLED) {
  pool = mysql.createPool({
    host:              process.env.DB_HOST!,
    port:              Number(process.env.DB_PORT || 3306),
    user:              process.env.DB_USER!,
    password:          process.env.DB_PASS || "",
    database:          process.env.DB_NAME!,
    waitForConnections: true,
    connectionLimit:   10,
    charset:           "utf8mb4",
  });
  console.log("✅ MySQL pool created for database:", process.env.DB_NAME);
} else {
  console.warn(
    "⚠️  DB env vars not set — running without MySQL. Data saved to localStorage only."
  );
}

// ---------------------------------------------------------------------------
// Create required tables on first boot
// ---------------------------------------------------------------------------

async function initDB() {
  if (!pool) return;
  const conn = await pool.getConnection();
  try {
    // Tenant data store: one row per entity per company
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

    // Global users table (not tenant-scoped) — JSON blob store
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS global_users (
        id           VARCHAR(50)  PRIMARY KEY,
        data         LONGTEXT     NOT NULL,
        updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Individual users table — one row per user, reliable login
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id           VARCHAR(100) PRIMARY KEY,
        email        VARCHAR(255) NOT NULL UNIQUE,
        password     VARCHAR(255) NOT NULL,
        name         VARCHAR(255) NOT NULL DEFAULT '',
        role         VARCHAR(100) NOT NULL DEFAULT 'Company Admin',
        company_id   VARCHAR(100) NOT NULL DEFAULT 'comp-1',
        branch_id    VARCHAR(100) NOT NULL DEFAULT 'br-hq',
        status       VARCHAR(50)  NOT NULL DEFAULT 'active',
        extra_json   LONGTEXT,
        created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Seed built-in accounts if not present
    await conn.execute(`
      INSERT IGNORE INTO users (id, email, password, name, role, company_id, branch_id)
      VALUES
        ('u-apex',   'apex7tech@gmail.com',    'Search@1959', 'Apex Tech Admin', 'System Admin',   'comp-1', 'br-hq'),
        ('u-demo',   'demo@deinrim.in',         'demo123....', 'Demo User',       'Read Only',       'comp-1', 'br-hq'),
        ('u-iswind', 'iswind.mail@gmail.com',   'isw@123',     'Iswind Client',   'Company Admin',   'comp-1', 'br-hq')
    `);

    console.log("✅ Database tables ready");
  } finally {
    conn.release();
  }
}

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json({ limit: "10mb" }));

  // ── Database health check ──────────────────────────────────────────────
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

  // ── TENANT DATA API ────────────────────────────────────────────────────
  // GET  /api/data/:companyId/:entity  → return entity JSON array (or null)
  // PUT  /api/data/:companyId/:entity  → upsert entity JSON array

  app.get("/api/data/:companyId/:entity", async (req, res) => {
    if (!pool) return res.json(null);
    const { companyId, entity } = req.params;
    try {
      const [rows] = await pool.execute(
        "SELECT data FROM tenant_data WHERE company_id = ? AND entity_type = ?",
        [companyId, entity]
      ) as [mysql.RowDataPacket[], mysql.FieldPacket[]];

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

  // ── STOCK IMPORT (Excel smart upsert) ────────────────────────────────
  // POST /api/stock/import/:companyId   multipart: field "file" = .xlsx
  // Matches rows by HSN code first, then product name (case-insensitive).
  // If matched → updates batchStock qty. If new → creates product + batchStock.

  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

  app.post("/api/stock/import/:companyId", upload.single("file"), async (req, res) => {
    if (!pool) return res.status(503).json({ error: "DB not available" });
    const { companyId } = req.params;
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    try {
      // Parse workbook — detect header row per sheet, normalise to standard fields
      const wb = XLSX.read(req.file.buffer, { type: "buffer" });

      // Known header keywords (case-insensitive substrings)
      const isDescCol  = (s: string) => /desc|name|product|item/i.test(s);
      const isHsnCol   = (s: string) => /hsn/i.test(s);
      const isRateCol  = (s: string) => /rate|price/i.test(s);
      const isUnitCol  = (s: string) => /^unit/i.test(s);
      const isQtyCol   = (s: string) => /clos|stock|qty|quant/i.test(s);
      const isCatCol   = (s: string) => /categ/i.test(s);

      interface NormRow { description: string; hsn: string; rate: number; unit: string; qty: number; category: string; }

      const allRows: NormRow[] = [];

      for (const sheetName of wb.SheetNames) {
        const raw = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: "" }) as any[][];
        if (raw.length < 2) continue;

        // Find the header row: first row containing a description-like and qty-like keyword
        let headerIdx = -1;
        for (let i = 0; i < Math.min(raw.length, 10); i++) {
          const cells = raw[i].map((c: any) => String(c));
          if (cells.some(isDescCol) && cells.some(isQtyCol)) { headerIdx = i; break; }
        }
        // Fallback: if any row has HSN + qty cols
        if (headerIdx === -1) {
          for (let i = 0; i < Math.min(raw.length, 10); i++) {
            const cells = raw[i].map((c: any) => String(c));
            if (cells.some(isHsnCol) && cells.some(isQtyCol)) { headerIdx = i; break; }
          }
        }
        // Last fallback: use row 0 as header and look for __EMPTY + CLOSING STOCK pattern
        if (headerIdx === -1) {
          const cols = raw[0].map((c: any) => String(c));
          if (cols.some(isQtyCol)) headerIdx = 0;
        }
        if (headerIdx === -1) continue;

        const headers = raw[headerIdx].map((c: any) => String(c).trim());
        const descIdx  = headers.findIndex(isDescCol);
        const hsnIdx   = headers.findIndex(isHsnCol);
        const rateIdx  = headers.findIndex(isRateCol);
        const unitIdx  = headers.findIndex(isUnitCol);
        const qtyIdx   = headers.findIndex(isQtyCol);
        const catIdx   = headers.findIndex(isCatCol);

        const fallbackDescIdx = descIdx === -1 ? 1 : descIdx;

        for (let r = headerIdx + 1; r < raw.length; r++) {
          const row = raw[r];
          const desc     = String(row[fallbackDescIdx] ?? "").trim();
          const hsn      = hsnIdx  >= 0 ? String(row[hsnIdx]  ?? "").trim() : "";
          const rate     = rateIdx >= 0 ? parseFloat(String(row[rateIdx] ?? 0).replace(/,/g, "")) || 0 : 0;
          const unit     = unitIdx >= 0 ? String(row[unitIdx]  ?? "").trim() || "Nos" : "Nos";
          const qty      = qtyIdx  >= 0 ? parseFloat(String(row[qtyIdx]  ?? 0).replace(/,/g, "")) || 0 : 0;
          const category = catIdx  >= 0 ? String(row[catIdx]   ?? "").trim() : "";
          if (desc) allRows.push({ description: desc, hsn, rate, unit, qty, category });
        }
      }

      // Load existing products + batchStocks from tenant_data
      const getEntity = async (entity: string) => {
        const [rows] = await pool!.execute(
          "SELECT data FROM tenant_data WHERE company_id = ? AND entity_type = ?",
          [companyId, entity]
        ) as [mysql.RowDataPacket[], mysql.FieldPacket[]];
        return rows.length ? JSON.parse(rows[0].data) : [];
      };
      const saveEntity = async (entity: string, data: any[]) => {
        await pool!.execute(
          `INSERT INTO tenant_data (company_id, entity_type, data)
           VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = NOW()`,
          [companyId, entity, JSON.stringify(data)]
        );
      };

      // ?clear=true wipes existing products+stocks before import (clean slate)
      const clearFirst = req.query.clear === "true";
      const products: any[]       = clearFirst ? [] : await getEntity("products");
      const batchStocks: any[]    = clearFirst ? [] : await getEntity("batchStocks");
      const categories: any[]     = await getEntity("categories");
      const stockMovements: any[] = clearFirst ? [] : await getEntity("stockMovements");

      // Helper: find or create a category by name, returns its id
      const getOrCreateCategoryId = (name: string): string => {
        if (!name) return "";
        const existing = categories.find((c: any) => c.name.trim().toLowerCase() === name.trim().toLowerCase());
        if (existing) return existing.id;
        const newId   = `cat-imp-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
        const newCode = name.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 6) || "IMP";
        categories.push({ id: newId, name: name.trim(), code: newCode, description: "Imported" });
        return newId;
      };

      let updated = 0, added = 0, skipped = 0;

      for (const { description, hsn, rate, unit, qty, category } of allRows) {
        if (!description) { skipped++; continue; }
        // Only skip rows where description looks like a section header (ends with # and no price/qty/hsn)
        if (description.endsWith("#") && !hsn && rate === 0 && qty === 0) { skipped++; continue; }

        const catId = getOrCreateCategoryId(category || "Water Treatment");

        // Match: name first (most reliable for ISW data), then HSN
        let existing = products.find((p: any) =>
          p.name && p.name.trim().toLowerCase() === description.toLowerCase()
        );
        if (!existing && hsn) {
          existing = products.find((p: any) => p.hsnCode && String(p.hsnCode).trim() === hsn);
        }

        const importTs = new Date().toISOString();
        if (existing) {
          existing.unit         = unit || existing.unit;
          existing.sellingPrice = rate || existing.sellingPrice;
          existing.categoryId   = catId || existing.categoryId;
          existing.description  = hsn ? `HSN: ${hsn}` : (existing.description || "");
          const bs = batchStocks.find((b: any) => b.productId === existing.id);
          if (bs) { bs.quantity = qty; bs.unit = unit || bs.unit; }
          else { batchStocks.push({ id: `bs-${existing.id}`, productId: existing.id, batchNumber: "STOCK", quantity: qty, unit, purchasePrice: 0, expiryDate: "", location: "", createdAt: importTs }); }
          if (qty > 0) {
            stockMovements.push({ id: `mv-imp-${existing.id}-${Date.now()}`, productId: existing.id, warehouseId: "wh-default", type: "IN", source: "OPENING", referenceId: "EXCEL-IMPORT", quantity: qty, unitPrice: rate, userId: "system", timestamp: importTs, remarks: `Opening stock import – ${description}` });
          }
          updated++;
        } else {
          const newId = `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          products.push({ id: newId, sku: "", name: description, categoryId: catId, brandId: "", unit, sellingPrice: rate, purchasePrice: 0, minStockLevel: 0, maxStockLevel: 0, description: hsn ? `HSN: ${hsn}` : "", createdAt: importTs });
          batchStocks.push({ id: `bs-${newId}`, productId: newId, batchNumber: "STOCK", quantity: qty, unit, purchasePrice: 0, expiryDate: "", location: "", createdAt: importTs });
          if (qty > 0) {
            stockMovements.push({ id: `mv-imp-${newId}`, productId: newId, warehouseId: "wh-default", type: "IN", source: "OPENING", referenceId: "EXCEL-IMPORT", quantity: qty, unitPrice: rate, userId: "system", timestamp: importTs, remarks: `Opening stock import – ${description}` });
          }
          added++;
        }
      }

      await saveEntity("products", products);
      await saveEntity("batchStocks", batchStocks);
      await saveEntity("categories", categories);
      await saveEntity("stockMovements", stockMovements);

      res.json({ ok: true, updated, added, skipped, total: allRows.length, categories: categories.length, movementsLogged: stockMovements.length });
    } catch (err) {
      console.error("POST /api/stock/import error:", err);
      res.status(500).json({ error: String(err) });
    }
  });

  // ── GLOBAL USERS API ───────────────────────────────────────────────────

  // POST /api/login  — server-side login, queries users table directly
  app.post("/api/login", express.json(), async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) return res.status(400).json({ error: "email and password required" });

    // Hardcoded built-in fallbacks (always work even if DB is down)
    const BUILTIN: Record<string, { id: string; name: string; role: string; companyId: string }> = {
      "apex7tech@gmail.com:Search@1959": { id: "u-apex", name: "Apex Tech Admin", role: "System Admin", companyId: "comp-1" },
      "demo@deinrim.in:demo123....":     { id: "u-demo", name: "Demo User",       role: "Read Only",    companyId: "comp-1" },
    };
    const builtinKey = `${email.toLowerCase().trim()}:${password}`;
    if (BUILTIN[builtinKey]) {
      return res.json({ ok: true, user: { ...BUILTIN[builtinKey], email: email.toLowerCase().trim(), branchId: "br-hq", status: "active" } });
    }

    if (!pool) return res.status(503).json({ error: "Database not available" });

    try {
      const [rows] = await pool.execute(
        "SELECT * FROM users WHERE email = ? AND password = ? AND status = 'active' LIMIT 1",
        [email.trim().toLowerCase(), password]
      ) as [mysql.RowDataPacket[], mysql.FieldPacket[]];

      if (rows.length === 0) return res.status(401).json({ error: "Invalid email or password" });

      const u = rows[0];
      let extra: Record<string, unknown> = {};
      try { if (u.extra_json) extra = JSON.parse(u.extra_json); } catch {}

      return res.json({
        ok: true,
        user: {
          id: u.id, name: u.name, email: u.email,
          role: u.role, companyId: u.company_id,
          branchId: u.branch_id, status: u.status,
          password: u.password, ...extra,
        },
      });
    } catch (err) {
      console.error("POST /api/login error:", err);
      return res.status(500).json({ error: "Login failed" });
    }
  });

  // GET /api/users — return all users from `users` table
  app.get("/api/users", async (_req, res) => {
    if (!pool) return res.json(null);
    try {
      const [rows] = await pool.execute("SELECT * FROM users WHERE status = 'active' ORDER BY created_at ASC") as [mysql.RowDataPacket[], mysql.FieldPacket[]];
      const users = rows.map(u => {
        let extra: Record<string, unknown> = {};
        try { if (u.extra_json) extra = JSON.parse(u.extra_json); } catch {}
        return { id: u.id, name: u.name, email: u.email, role: u.role, companyId: u.company_id, branchId: u.branch_id, status: u.status, password: u.password, ...extra };
      });
      res.json(users.length > 0 ? users : null);
    } catch (err) {
      console.error("GET /api/users error:", err);
      res.status(500).json({ error: "DB read failed" });
    }
  });

  // PUT /api/users — sync full users array into `users` table (upsert each)
  app.put("/api/users", express.json(), async (req, res) => {
    if (!pool) return res.json({ ok: true, persisted: false });
    try {
      const users = Array.isArray(req.body) ? req.body : [];
      for (const u of users) {
        if (!u.email) continue;
        const extra = Object.fromEntries(
          Object.entries(u).filter(([k]) => !["id","name","email","password","role","companyId","branchId","status"].includes(k))
        );
        await pool.execute(
          `INSERT INTO users (id, email, password, name, role, company_id, branch_id, status, extra_json)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             password   = VALUES(password),
             name       = VALUES(name),
             role       = VALUES(role),
             company_id = VALUES(company_id),
             branch_id  = VALUES(branch_id),
             status     = VALUES(status),
             extra_json = VALUES(extra_json)`,
          [
            u.id || ("u-" + u.email.replace(/[^a-z0-9]/gi,"").slice(0,12)),
            u.email.toLowerCase().trim(),
            u.password || "",
            u.name || u.email,
            u.role || "Company Admin",
            u.companyId || "comp-1",
            u.branchId || "br-hq",
            u.status || "active",
            Object.keys(extra).length ? JSON.stringify(extra) : null,
          ]
        );
      }
      // Also keep the legacy JSON blob in sync
      const serialized = JSON.stringify(req.body);
      await pool.execute(
        `INSERT INTO global_users (id, data) VALUES ('__global__', ?) ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = NOW()`,
        [serialized]
      );
      res.json({ ok: true });
    } catch (err) {
      console.error("PUT /api/users error:", err);
      res.status(500).json({ error: "DB write failed" });
    }
  });

  // ── Quick account restore via browser URL (GET) ───────────────────────
  // Visit: /api/restore?email=x@x.com&password=pass&name=Name&companyId=comp-1
  app.get("/api/restore", async (req, res) => {
    if (!pool) return res.send("❌ Database not available");
    const { email, password, name, role, companyId, branchId } = req.query as Record<string, string>;
    if (!email || !password) return res.send("❌ Missing email or password in URL");
    try {
      const id = "u-" + email.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 20);
      await pool.execute(
        `INSERT INTO users (id, email, password, name, role, company_id, branch_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
         ON DUPLICATE KEY UPDATE
           password   = VALUES(password),
           name       = VALUES(name),
           role       = VALUES(role),
           company_id = VALUES(company_id),
           status     = 'active'`,
        [id, email.toLowerCase().trim(), password,
         name || email.split("@")[0],
         role || "Company Admin",
         companyId || "comp-1",
         branchId || "br-hq"]
      );
      res.send(`
        <html><body style="font-family:sans-serif;padding:40px;background:#0f172a;color:#fff">
        <h2 style="color:#4ade80">✅ Account Restored!</h2>
        <p><b>Email:</b> ${email}</p>
        <p><b>Company Data:</b> ${companyId || "comp-1"} (all existing data safe)</p>
        <p style="color:#94a3b8">Account saved to database. Client can now login.</p>
        <a href="/" style="display:inline-block;margin-top:20px;background:#4f46e5;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none">Go to Login</a>
        </body></html>
      `);
    } catch (err) {
      console.error("restore error:", err);
      res.send("❌ Error: " + String(err));
    }
  });

  // ── Ensure a user exists (upsert into users table) ───────────────────
  // POST /api/users/ensure  body: { email, password, name, role, companyId }
  app.post("/api/users/ensure", express.json(), async (req, res) => {
    if (!pool) return res.status(503).json({ error: "DB not available" });
    try {
      const { email, password, name, role, companyId, branchId } = req.body as {
        email: string; password: string; name?: string;
        role?: string; companyId?: string; branchId?: string;
      };
      if (!email || !password) return res.status(400).json({ error: "email and password required" });

      const id = "u-" + email.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 20);
      await pool.execute(
        `INSERT INTO users (id, email, password, name, role, company_id, branch_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
         ON DUPLICATE KEY UPDATE
           password   = VALUES(password),
           name       = VALUES(name),
           role       = VALUES(role),
           company_id = VALUES(company_id),
           branch_id  = VALUES(branch_id),
           status     = 'active'`,
        [id, email.toLowerCase().trim(), password, name || email.split("@")[0],
         role || "Company Admin", companyId || "comp-1", branchId || "br-hq"]
      );
      res.json({ ok: true, message: `Account ${email} saved to database` });
    } catch (err) {
      console.error("ensure-user error:", err);
      res.status(500).json({ error: "DB write failed" });
    }
  });

  // ── Bill Scanner (Claude Vision OCR) ──────────────────────────────────
  // POST /api/scan-bill  multipart: field "image" = JPG/PNG/PDF image
  app.post("/api/scan-bill", upload.single("image"), async (req, res) => {
    const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_KEY) return res.status(400).json({ error: "ANTHROPIC_API_KEY not configured in environment" });
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    const base64 = req.file.buffer.toString("base64");
    const mediaType = (req.file.mimetype || "image/jpeg") as "image/jpeg" | "image/png" | "image/webp" | "image/gif";

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          messages: [{
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: base64 },
              },
              {
                type: "text",
                text: `Extract purchase bill / tax invoice data from this image and return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "supplierName": "",
  "supplierGSTIN": "",
  "billNumber": "",
  "invoiceDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD or empty",
  "challanNo": "",
  "eWayBillNo": "",
  "vehicleNo": "",
  "transportMode": "Road",
  "items": [
    {
      "description": "",
      "hsn": "",
      "qty": 1,
      "unit": "Nos",
      "rate": 0,
      "gstPct": 18
    }
  ],
  "narration": ""
}
Rules: invoiceDate must be YYYY-MM-DD format or empty string. qty and rate are numbers. gstPct is 0/5/12/18/28. If a field is not visible, use empty string or 0. Return only the JSON object.`,
              },
            ],
          }],
        }),
      });

      const data = await response.json() as { content?: Array<{ type: string; text: string }> };
      const text = data.content?.[0]?.type === "text" ? data.content[0].text.trim() : "";
      // Strip markdown code fences if Claude wraps the JSON
      const jsonText = text.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
      const parsed = JSON.parse(jsonText);
      return res.json({ success: true, bill: parsed });
    } catch (err) {
      console.error("scan-bill error:", err);
      return res.status(500).json({ error: "Failed to extract bill data from image" });
    }
  });

  // ── e-Invoice GSP Proxy ────────────────────────────────────────────────
  // POST /api/einvoice/generate  — authenticate with GSP, then generate IRN
  app.post("/api/einvoice/generate", express.json(), async (req, res) => {
    const { invoice, company } = req.body as {
      invoice: Record<string, unknown>;
      company: {
        gstin?: string; name?: string; address?: string; state?: string;
        gspApiUrl?: string; gspClientId?: string; gspClientSecret?: string;
        gspUsername?: string; gspPassword?: string;
      };
    };

    const gspUrl = company.gspApiUrl?.replace(/\/$/, "");
    if (!gspUrl) {
      return res.status(400).json({ error: "GSP API URL not configured in Company Settings." });
    }
    if (!company.gspClientId || !company.gspClientSecret) {
      return res.status(400).json({ error: "GSP Client ID / Secret not configured in Company Settings." });
    }

    try {
      // Step 1: Get auth token from GSP
      const authRes = await fetch(`${gspUrl}/auth/api/authenticate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          UserName: company.gspUsername || "",
          Password: company.gspPassword || "",
          AppKey: company.gspClientSecret,
          ForceRefreshAccessToken: false,
        }),
      });

      if (!authRes.ok) {
        const errText = await authRes.text();
        return res.status(502).json({ error: `GSP auth failed: ${errText}` });
      }

      const authData = await authRes.json() as { AuthToken?: string; Status?: number; error?: string };
      if (!authData.AuthToken) {
        return res.status(502).json({ error: `GSP auth error: ${JSON.stringify(authData)}` });
      }
      const authToken = authData.AuthToken;

      // Step 2: Build GSTN e-Invoice JSON payload
      const inv = invoice as {
        invoiceNumber?: string; createdAt?: string; buyerName?: string; buyerGSTIN?: string;
        billingAddress?: string; buyerState?: string; subtotal?: number; cgst?: number;
        sgst?: number; totalAmount?: number; items?: Array<Record<string, unknown>>;
        eWayBillNo?: string;
      };

      const gstnPayload = {
        Version: "1.1",
        TranDtls: { TaxSch: "GST", SupTyp: "B2B", RegRev: "N", EcmGstin: null, IgstOnIntra: "N" },
        DocDtls: {
          Typ: "INV",
          No: inv.invoiceNumber || "",
          Dt: (inv.createdAt || "").slice(0, 10).split("-").reverse().join("/"),
        },
        SellerDtls: {
          Gstin: company.gstin || "",
          LglNm: company.name || "",
          Addr1: company.address || "",
          Loc: company.state || "",
          Pin: 700000,
          Stcd: "19",
        },
        BuyerDtls: {
          Gstin: inv.buyerGSTIN || "URP",
          LglNm: inv.buyerName || "",
          Addr1: inv.billingAddress || "",
          Loc: inv.buyerState || "",
          Pin: 700000,
          Stcd: "19",
          Pos: "19",
        },
        ValDtls: {
          AssVal: inv.subtotal || 0,
          CgstVal: inv.cgst || 0,
          SgstVal: inv.sgst || 0,
          IgstVal: 0,
          TotInvVal: inv.totalAmount || 0,
        },
        ItemList: ((inv.items || []) as Array<{
          description?: string; hsn?: string; quantity?: number; unitPrice?: number;
          gstPct?: number; unit?: string;
        }>).map((item, idx) => ({
          SlNo: String(idx + 1),
          PrdDesc: item.description || "",
          IsServc: "N",
          HsnCd: item.hsn || "00000000",
          Qty: item.quantity || 1,
          Unit: item.unit || "NOS",
          UnitPrice: item.unitPrice || 0,
          TotAmt: (item.quantity || 1) * (item.unitPrice || 0),
          AssAmt: (item.quantity || 1) * (item.unitPrice || 0),
          GstRt: item.gstPct || 18,
          CgstAmt: ((item.quantity || 1) * (item.unitPrice || 0)) * ((item.gstPct || 18) / 200),
          SgstAmt: ((item.quantity || 1) * (item.unitPrice || 0)) * ((item.gstPct || 18) / 200),
          IgstAmt: 0,
          TotItemVal: ((item.quantity || 1) * (item.unitPrice || 0)) * (1 + (item.gstPct || 18) / 100),
        })),
      };

      // Step 3: Submit to GSP for IRN generation
      const irnRes = await fetch(`${gspUrl}/eicore/v1.03/Invoice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "user_name": company.gspUsername || "",
          "authtoken": authToken,
          "Gstin": company.gstin || "",
        },
        body: JSON.stringify(gstnPayload),
      });

      const irnData = await irnRes.json() as {
        Status?: number; Irn?: string; AckNo?: string; AckDt?: string;
        SignedQRCode?: string; SignedInvoice?: string; EwbNo?: string;
        ErrorDetails?: Array<{ ErrorCode?: string; ErrorMessage?: string }>;
      };

      if (!irnRes.ok || !irnData.Irn) {
        return res.status(502).json({
          error: `IRN generation failed: ${JSON.stringify(irnData.ErrorDetails || irnData)}`,
        });
      }

      return res.json({
        irn: irnData.Irn,
        ackNo: irnData.AckNo || "",
        ackDate: irnData.AckDt || "",
        qrCode: irnData.SignedQRCode || "",
        ewbNo: irnData.EwbNo || "",
      });

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("e-Invoice GSP error:", message);
      return res.status(500).json({ error: `GSP connection error: ${message}` });
    }
  });

  // ── Help page ──────────────────────────────────────────────────────────
  app.get("/help", (_req, res) => {
    res.sendFile(path.join(process.cwd(), "public", "help.html"));
  });

  // ── Vite dev middleware / static prod files ────────────────────────────

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // ── Boot ───────────────────────────────────────────────────────────────
  await initDB();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 DEINRIM OMS running on http://localhost:${PORT}`);
    console.log(`   Mode: ${process.env.NODE_ENV || "development"}`);
  });
}

startServer().catch(console.error);
