import { useCallback } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { BillingData } from "@/lib/schema";
import { toast } from "sonner";
import { pdfBlobFromElement } from "@/lib/export/pdf";

export const useExport = () => {
  const exportAsPNG = useCallback(async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 3, backgroundColor: null });
      const link = document.createElement("a");
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("PNG Downloaded Successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export PNG");
    }
  }, []);

  const exportAsSVG = useCallback((elementId: string, filename: string) => {
    const svg = document.querySelector(`#${elementId} svg`);
    if (!svg) return;

    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      const link = document.createElement("a");
      link.download = `${filename}.svg`;
      link.href = url;
      link.click();
      toast.success("SVG Downloaded Successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export SVG");
    }
  }, []);

  const exportElementAsPDFBlob = useCallback(async (elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) throw new Error("Export failed: element not found");
    return pdfBlobFromElement(element);
  }, []);

  const exportElementAsPDF = useCallback(async (elementId: string, filename: string) => {
    const toastId = toast.loading("Generating PDF...");
    const element = document.getElementById(elementId);
    if (!element) {
      toast.dismiss(toastId);
      toast.error("Export failed: element not found");
      return;
    }

    try {
      const blob = await pdfBlobFromElement(element);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename || "invoice"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.dismiss(toastId);
      toast.success("PDF downloaded");
    } catch (error) {
      console.error(error);
      toast.dismiss(toastId);
      toast.error("Failed to export PDF");
    }
  }, []);

  const exportAsPDF = useCallback(async (data: BillingData) => {
    const toastId = toast.loading("Generating PDF Invoice...");

    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();

      // Layout constants
      const margin = 20;
      let currentY = 30;

      // Brand Header
      doc.setFontSize(24);
      doc.setTextColor(0, 0, 0); // Need to use RGB numbers or hex correctly in jspdf
      doc.setFont("helvetica", "bold");
      doc.text("INVOICE", margin, currentY);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(`Ref: ${data.referenceId}`, pageWidth - margin - 50, currentY);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin - 50, currentY + 5);

      currentY += 20;
      doc.setDrawColor(230);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 15;

      // Business Info
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text("FROM (MERCHANT):", margin, currentY);
      doc.text("TO (PAYER):", pageWidth / 2 + 10, currentY);
      currentY += 8;

      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.text(data.merchantName, margin, currentY);
      doc.text("Customer / Payer", pageWidth / 2 + 10, currentY);
      currentY += 6;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(data.merchantAddress || "No address provided", margin, currentY);
      doc.text(data.merchantEmail || "No billing email", margin, currentY + 5);

      currentY += 25;

      // Table Header
      doc.setFillColor(245, 245, 250);
      doc.rect(margin, currentY, pageWidth - (margin * 2), 10, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(50);
      doc.text("DESCRIPTION", margin + 5, currentY + 6.5);
      doc.text("QTY", margin + 100, currentY + 6.5);
      doc.text("PRICE", margin + 125, currentY + 6.5);
      doc.text("TOTAL", margin + 155, currentY + 6.5);

      currentY += 15;

      // Items Mapping
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80);

      if (data.items.length === 0) {
        doc.text("Adjustment / Custom Billing", margin + 5, currentY);
        doc.text("1", margin + 100, currentY);
        doc.text(`${data.currency} ${data.amount}`, margin + 125, currentY);
        doc.text(`${data.currency} ${data.amount}`, margin + 155, currentY);
        currentY += 10;
      } else {
        data.items.forEach(item => {
          const itemTotal = (item.quantity * item.price).toFixed(2);
          doc.text(item.description, margin + 5, currentY);
          doc.text(item.quantity.toString(), margin + 100, currentY);
          doc.text(item.price.toFixed(2), margin + 125, currentY);
          doc.text(itemTotal, margin + 155, currentY);
          currentY += 8;
        });
      }

      currentY += 10;
      doc.setDrawColor(240);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 10;

      // Totals Section
      const subtotal = data.items.reduce((acc, i) => acc + (i.price * i.quantity), 0) || Number(data.amount);
      const tax = subtotal * (data.taxRate / 100);
      const finalTotal = subtotal + tax;

      doc.setFontSize(10);
      doc.text("Subtotal:", margin + 125, currentY);
      doc.text(`${data.currency} ${subtotal.toFixed(2)}`, margin + 155, currentY);
      currentY += 7;

      doc.text(`Tax (${data.taxRate}%):`, margin + 125, currentY);
      doc.text(`${data.currency} ${tax.toFixed(2)}`, margin + 155, currentY);
      currentY += 10;

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      doc.text("GRAND TOTAL:", margin + 115, currentY);
      doc.text(`${data.currency} ${finalTotal.toFixed(2)}`, margin + 155, currentY);

      // FOOTER & QR CODE
      currentY += 25;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("PAYMENT INFORMATION", margin, currentY);
      currentY += 8;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text("Please scan the QR code to proceed with the secure payment.", margin, currentY);
      doc.text(`Reference: ${data.referenceId}`, margin, currentY + 5);
      if (data.note) doc.text(`Memo: ${data.note}`, margin, currentY + 10);

      // Render QR Code onto PDF
      const qrElement = document.querySelector("#qr-code-element svg") as HTMLElement;
      if (qrElement) {
        const canvas = await html2canvas(qrElement, { scale: 2 });
        const qrImgData = canvas.toDataURL("image/png");
        doc.addImage(qrImgData, "PNG", margin, currentY + 20, 50, 50);
      }

      // Standard Indicators
      doc.setFontSize(8);
      doc.setTextColor(180);
      doc.text(`Generated via QBilling Engine - Standard: ${data.standard.toUpperCase()}`, margin, 280);

      doc.save(`${data.referenceId || "invoice"}.pdf`);
      toast.dismiss(toastId);
      toast.success("PDF Invoice Ready!");
    } catch (error) {
      console.error(error);
      toast.dismiss(toastId);
      toast.error("PDF engine failed unexpectedly");
    }
  }, []);

  return { exportAsPNG, exportAsSVG, exportElementAsPDFBlob, exportElementAsPDF, exportAsPDF };
};
