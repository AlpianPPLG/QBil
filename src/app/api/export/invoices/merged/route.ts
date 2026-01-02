import { NextResponse } from "next/server";
import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";
import { billingSchema } from "@/lib/schema";
import { renderInvoiceHtml } from "@/lib/export/serverInvoiceHtml";

export const runtime = "nodejs";

const requestSchema = billingSchema
  .transform((x) => x)
  .array();

export async function POST(req: Request) {
  // Body: BillingData[] (client sends selected invoices data)
  const json = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const invoices = parsed.data;
  if (invoices.length === 0) {
    return NextResponse.json({ error: "No invoices" }, { status: 400 });
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    const merged = await PDFDocument.create();

    for (const data of invoices) {
      const html = renderInvoiceHtml(data);
      await page.setContent(html, { waitUntil: "load" });

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "16mm", right: "16mm", bottom: "16mm", left: "16mm" },
      });

      const doc = await PDFDocument.load(pdfBuffer);
      const copied = await merged.copyPages(doc, doc.getPageIndices());
      for (const p of copied) merged.addPage(p);
    }

    const out = await merged.save();
    return new NextResponse(Buffer.from(out), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoices-merged.pdf"`,
      },
    });
  } finally {
    await page.close().catch(() => undefined);
    await browser.close().catch(() => undefined);
  }
}
