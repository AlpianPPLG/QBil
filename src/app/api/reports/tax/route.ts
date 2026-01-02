import { NextResponse } from "next/server";
import { invoicesRepo } from "@/lib/storage/invoicesRepo";
import { reportQuerySchema } from "@/lib/schema";
import { buildTaxReport, taxReportToCsv } from "@/lib/reports/tax";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const queryCandidate = {
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    currency: searchParams.get("currency") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  };

  const parsed = reportQuerySchema.safeParse(queryCandidate);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query", details: parsed.error.flatten() }, { status: 400 });
  }

  const invoices = invoicesRepo.list();
  const reports = buildTaxReport(invoices, parsed.data);

  const format = (searchParams.get("format") ?? "json").toLowerCase();
  if (format === "csv") {
    const csv = taxReportToCsv(reports);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="tax-report-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json({ reports });
}
