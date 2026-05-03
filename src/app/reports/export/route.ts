import { NextResponse } from "next/server";
import { requireCouple } from "@/lib/auth/context";
import { expensesByCategory, expensesByMember, sumExpenses } from "@/lib/expenses/summary";
import { formatCurrency, monthLabel, monthStart, nextMonthStart } from "@/lib/utils";
import type { ExpenseRow } from "@/types/app";

function cleanMonth(value: string | null) {
  return /^\d{4}-\d{2}-01$/.test(value ?? "") ? value! : monthStart();
}

function escapeXml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeHtml(value: string | number | null | undefined) {
  return escapeXml(value);
}

function reportFileName(coupleName: string, month: string, extension: string) {
  const safeName = coupleName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `relatorio-${safeName || "casal"}-${month.slice(0, 7)}.${extension}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "xls" ? "xls" : "pdf";
  const start = cleanMonth(searchParams.get("month"));
  const end = nextMonthStart(new Date(`${start}T12:00:00`));
  const { supabase, couple, members } = await requireCouple();

  const { data } = await supabase
    .from("expenses")
    .select("*, couple_members(display_name)")
    .eq("couple_id", couple.id)
    .gte("expense_date", start)
    .lt("expense_date", end)
    .order("expense_date", { ascending: false });

  const expenses = (data ?? []) as ExpenseRow[];
  const total = sumExpenses(expenses);
  const byCategory = expensesByCategory(expenses);
  const byMember = expensesByMember(expenses, members);

  if (format === "xls") {
    const rows = expenses
      .map(
        (expense) => `
          <Row>
            <Cell><Data ss:Type="String">${escapeXml(expense.expense_date)}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(expense.description)}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(expense.category)}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(expense.couple_members?.display_name ?? "Pessoa")}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(expense.payment_method ?? "-")}</Data></Cell>
            <Cell><Data ss:Type="Number">${Number(expense.amount)}</Data></Cell>
          </Row>`,
      )
      .join("");

    const categoryRows = byCategory
      .map(
        (item) => `
          <Row>
            <Cell><Data ss:Type="String">${escapeXml(item.name)}</Data></Cell>
            <Cell><Data ss:Type="Number">${item.value}</Data></Cell>
          </Row>`,
      )
      .join("");

    const memberRows = byMember
      .map(
        (item) => `
          <Row>
            <Cell><Data ss:Type="String">${escapeXml(item.name)}</Data></Cell>
            <Cell><Data ss:Type="Number">${item.value}</Data></Cell>
          </Row>`,
      )
      .join("");

    const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header"><Font ss:Bold="1"/><Interior ss:Color="#D9FBE7" ss:Pattern="Solid"/></Style>
  </Styles>
  <Worksheet ss:Name="Resumo">
    <Table>
      <Row><Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(couple.name)} - ${escapeXml(monthLabel(start))}</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">Total</Data></Cell><Cell><Data ss:Type="Number">${total}</Data></Cell></Row>
      <Row />
      <Row><Cell ss:StyleID="Header"><Data ss:Type="String">Categoria</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Valor</Data></Cell></Row>
      ${categoryRows}
      <Row />
      <Row><Cell ss:StyleID="Header"><Data ss:Type="String">Pessoa</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Valor</Data></Cell></Row>
      ${memberRows}
    </Table>
  </Worksheet>
  <Worksheet ss:Name="Gastos">
    <Table>
      <Row>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Data</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Descrição</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Categoria</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Pessoa</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Pagamento</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Valor</Data></Cell>
      </Row>
      ${rows}
    </Table>
  </Worksheet>
</Workbook>`;

    return new NextResponse(workbook, {
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": `attachment; filename="${reportFileName(couple.name, start, "xls")}"`,
      },
    });
  }

  const categoryCards = byCategory
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.name)}</td>
          <td>${escapeHtml(formatCurrency(item.value))}</td>
        </tr>`,
    )
    .join("");

  const expenseRows = expenses
    .map(
      (expense) => `
        <tr>
          <td>${escapeHtml(new Date(`${expense.expense_date}T12:00:00`).toLocaleDateString("pt-BR"))}</td>
          <td>${escapeHtml(expense.description)}</td>
          <td>${escapeHtml(expense.category)}</td>
          <td>${escapeHtml(expense.couple_members?.display_name ?? "Pessoa")}</td>
          <td>${escapeHtml(expense.payment_method ?? "-")}</td>
          <td>${escapeHtml(formatCurrency(expense.amount))}</td>
        </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Relatório ${escapeHtml(couple.name)} - ${escapeHtml(monthLabel(start))}</title>
  <style>
    @page { margin: 18mm; }
    body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #111827; background: #f7f8fa; margin: 0; }
    main { max-width: 920px; margin: 0 auto; padding: 32px; }
    header { background: #111827; color: white; border-radius: 8px; padding: 28px; }
    h1 { margin: 0; font-size: 32px; }
    .muted { color: #6b7280; }
    .hero-muted { color: rgba(255,255,255,.72); margin: 8px 0 0; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 18px 0; }
    .card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: .14em; font-weight: 900; color: #6b7280; }
    .value { font-size: 22px; font-weight: 900; margin-top: 8px; }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; margin-top: 16px; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: left; font-size: 13px; }
    th { background: #d9fbe7; font-size: 11px; text-transform: uppercase; letter-spacing: .12em; }
    .section { margin-top: 24px; }
    .print { margin: 18px 0; }
    button { border: 0; border-radius: 8px; background: #111827; color: white; padding: 12px 16px; font-weight: 800; cursor: pointer; }
    @media print { body { background: white; } main { padding: 0; } .print { display: none; } }
  </style>
</head>
<body>
  <main>
    <header>
      <p class="label" style="color:rgba(255,255,255,.6)">Relatório mensal</p>
      <h1>${escapeHtml(couple.name)} · ${escapeHtml(monthLabel(start))}</h1>
      <p class="hero-muted">Resumo organizado para salvar em PDF ou imprimir.</p>
    </header>
    <div class="print"><button onclick="window.print()">Salvar como PDF</button></div>
    <section class="grid">
      <div class="card"><p class="label">Total</p><p class="value">${escapeHtml(formatCurrency(total))}</p></div>
      <div class="card"><p class="label">Categorias</p><p class="value">${byCategory.length}</p></div>
      <div class="card"><p class="label">Lançamentos</p><p class="value">${expenses.length}</p></div>
    </section>
    <section class="section">
      <h2>Onde a grana foi</h2>
      <table><thead><tr><th>Categoria</th><th>Valor</th></tr></thead><tbody>${categoryCards}</tbody></table>
    </section>
    <section class="section">
      <h2>Gastos detalhados</h2>
      <table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Pessoa</th><th>Pagamento</th><th>Valor</th></tr></thead><tbody>${expenseRows}</tbody></table>
    </section>
  </main>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
