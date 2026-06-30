function toCSV(headers: string[], rows: (string | number | undefined | null)[][]): string {
  const escape = (v: string | number | undefined | null) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [headers, ...rows].map(row => row.map(escape).join(",")).join("\n");
}

function download(filename: string, content: string) {
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportLeadsCSV(leads: any[]) {
  const headers = ["Lead Name", "Company", "Email", "Phone", "Status", "Source", "Assigned To", "Last Contacted", "Notes"];
  const rows = leads.map(l => [l.name, l.companyName, l.email, l.phone, l.status, l.source, l.assignedTo, l.lastContacted, l.notes]);
  download(`Leads_Export_${new Date().toISOString().slice(0,10)}.csv`, toCSV(headers, rows));
}

export function exportInvoicesCSV(invoices: any[], customers: any[]) {
  const headers = ["Invoice No.", "Customer", "Date", "Due Date", "Subtotal (₹)", "Tax (₹)", "Total (₹)", "Status"];
  const rows = invoices.map(inv => {
    const cust = customers.find((c: any) => c.id === inv.customerId);
    return [inv.invoiceNumber, cust?.name ?? "", inv.createdAt, inv.dueDate, inv.subtotal, inv.taxAmount, inv.totalAmount, inv.status];
  });
  download(`Invoices_Export_${new Date().toISOString().slice(0,10)}.csv`, toCSV(headers, rows));
}

export function exportProductsCSV(products: any[]) {
  const headers = ["SKU", "Product Name", "Unit", "Purchase Price (₹)", "Selling Price (₹)", "Min Stock", "Max Stock"];
  const rows = products.map(p => [p.sku, p.name, p.unit, p.purchasePrice, p.sellingPrice, p.minStockLevel, p.maxStockLevel]);
  download(`Products_Export_${new Date().toISOString().slice(0,10)}.csv`, toCSV(headers, rows));
}

export function exportEmployeesCSV(employees: any[]) {
  const headers = ["Employee ID", "Name", "Email", "Phone", "Department", "Designation", "Joining Date", "Salary (₹)", "Status"];
  const rows = employees.map(e => [e.employeeCode ?? e.employeeId, e.name, e.email, e.phone, e.departmentId, e.designationId, e.joiningDate, e.salary, e.status]);
  download(`Employees_Export_${new Date().toISOString().slice(0,10)}.csv`, toCSV(headers, rows));
}

export function exportPurchaseOrdersCSV(pos: any[], suppliers: any[]) {
  const headers = ["PO Number", "Supplier", "Total Amount (₹)", "Status", "Payment Status", "Delivery Date", "Created At"];
  const rows = pos.map(po => {
    const sup = suppliers.find((s: any) => s.id === po.supplierId);
    return [po.poNumber, sup?.name ?? "", po.totalAmount, po.status, po.paymentStatus, po.deliveryDate ?? "", po.createdAt];
  });
  download(`PurchaseOrders_Export_${new Date().toISOString().slice(0,10)}.csv`, toCSV(headers, rows));
}

export function exportTransactionsCSV(transactions: any[]) {
  const headers = ["Date", "Type", "Category", "Amount (₹)", "Payment Method", "Reference", "Description"];
  const rows = transactions.map(t => [t.date, t.type, t.category, t.amount, t.paymentMethod, t.referenceId ?? "", t.description]);
  download(`Transactions_Export_${new Date().toISOString().slice(0,10)}.csv`, toCSV(headers, rows));
}
