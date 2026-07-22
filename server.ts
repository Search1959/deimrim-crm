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

    // Global users table (not tenant-scoped)
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS global_users (
        id           VARCHAR(50)  PRIMARY KEY,
        data         LONGTEXT     NOT NULL,
        updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
  // GET  /api/users           → return full users array
  // PUT  /api/users           → save full users array

  app.get("/api/users", async (_req, res) => {
    if (!pool) return res.json(null);
    try {
      const [rows] = await pool.execute(
        "SELECT data FROM global_users LIMIT 1"
      ) as [mysql.RowDataPacket[], mysql.FieldPacket[]];
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

  // ── DEINRIM Services app at /services ────────────────────────────────
  const servicesPath = path.join(process.cwd(), "services-dist");
  app.use("/services", express.static(servicesPath));
  app.get("/services/*", (_req, res) => {
    res.sendFile(path.join(servicesPath, "index.html"));
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
