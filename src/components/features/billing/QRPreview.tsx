"use client";

import React, { useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import { BillingData } from "@/lib/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, ShieldCheck, Zap, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface QRPreviewProps {
    data: BillingData;
    onDownload: (format: "png" | "svg" | "pdf") => void;
}

export const QRPreview: React.FC<QRPreviewProps> = ({ data, onDownload }) => {
    const qrValue = useMemo(() => {
        const { merchantName, merchantEmail, amount, currency, referenceId, note, standard } = data;

        switch (standard) {
            case "epc":
                return `BCD\n002\n1\nSCT\n\n${merchantName}\n\n${currency}${amount}\n\n${referenceId}\n${note}`;
            case "upi":
                return `upi://pay?pa=${merchantEmail || "merchant@upi"}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=${currency}&tn=${encodeURIComponent(note)}`;
            case "swiss":
                return `SPC\n0200\n1\n\n\n${merchantName}\n\n\n\n\n${amount}\n${currency}\n\n${referenceId}\n\n${note}`;
            default:
                return JSON.stringify({
                    merchant: merchantName,
                    amount: amount,
                    currencyCode: currency,
                    invoice: referenceId,
                    memo: note,
                    v: "1.0",
                });
        }
    }, [data]);

    const subtotal = data.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const taxValue = subtotal * (data.taxRate / 100);

    // Template specific styles
    const templateStyles = useMemo(() => {
        switch (data.templateId) {
            case "classic":
                return {
                    card: "bg-zinc-50 text-zinc-950 border-zinc-200 shadow-xl",
                    header: "text-zinc-600",
                    badge: "bg-zinc-200 text-zinc-800 border-zinc-300",
                    footer: "bg-zinc-100 border-zinc-200",
                    accent: "text-zinc-900",
                    icon: "text-zinc-400"
                };
            case "minimal":
                return {
                    card: "bg-white text-black border-none shadow-none",
                    header: "text-zinc-400",
                    badge: "bg-zinc-100 text-zinc-500 border-transparent",
                    footer: "bg-white border-t border-zinc-100",
                    accent: "text-primary",
                    icon: "text-zinc-200"
                };
            case "bold":
                return {
                    card: "bg-black text-white border-zinc-800 shadow-[0_0_50px_-12px_rgba(var(--primary),0.3)]",
                    header: "text-primary",
                    badge: "bg-primary text-black border-none",
                    footer: "bg-zinc-900 border-zinc-800",
                    accent: "text-white",
                    icon: "text-primary"
                };
            default: // modern
                return {
                    card: "bg-gradient-to-br from-card to-secondary/10 border-none shadow-2xl",
                    header: "text-foreground",
                    badge: "bg-primary/10 text-primary border-primary/20",
                    footer: "bg-muted/20 border-border/50",
                    accent: "text-primary",
                    icon: "text-yellow-500"
                };
        }
    }, [data.templateId]);

    return (
        <Card className={cn("overflow-hidden sticky top-8 transition-all duration-500", templateStyles.card)}>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Zap className={cn("w-5 h-5 fill-current", templateStyles.icon)} />
                        {data.templateId === "minimal" ? "Terminal" : "Live Engine"}
                    </div>
                    <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full border transition-colors", templateStyles.badge)}>
                        <span className={cn("w-2 h-2 rounded-full animate-pulse bg-current")} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Sync Active</span>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={qrValue + data.qrColor + data.backgroundColor}
                        initial={{ scale: 0.9, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: -10 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="p-8 bg-white rounded-[2rem] shadow-2xl relative group"
                        id="qr-code-element"
                        style={{ backgroundColor: data.backgroundColor }}
                    >
                        <QRCodeSVG
                            value={qrValue}
                            size={220}
                            fgColor={data.qrColor}
                            bgColor={data.backgroundColor}
                            level={data.errorCorrectionLevel}
                            includeMargin={false}
                            imageSettings={
                                data.logoUrl
                                    ? {
                                        src: data.logoUrl,
                                        x: undefined,
                                        y: undefined,
                                        height: 38,
                                        width: 38,
                                        excavate: true,
                                    }
                                    : undefined
                            }
                        />
                        <div className="absolute inset-0 bg-primary/5 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </motion.div>
                </AnimatePresence>

                <div className="mt-8 w-full max-w-[280px] space-y-4">
                    <div className="text-center space-y-1">
                        <h3 className="text-lg font-extrabold truncate leading-tight">
                            {data.merchantName || "Identity Required"}
                        </h3>
                        <div className="flex items-center justify-center gap-2">
                            <p className="text-[10px] opacity-60 uppercase tracking-widest font-black">
                                {data.standard} standard
                            </p>
                            <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                        </div>
                    </div>

                    <div className={cn("p-4 rounded-2xl border transition-colors",
                        data.templateId === 'bold' ? 'bg-zinc-900 border-zinc-800' : 'bg-muted/40 border-border/50')}>
                        <div className="divide-y divide-border/20">
                            <div className="flex justify-between items-center py-1.5">
                                <span className="text-[10px] uppercase font-bold opacity-50 tracking-tighter">Subtotal</span>
                                <span className="text-sm font-mono">{data.currency} {subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center py-1.5">
                                <span className="text-[10px] uppercase font-bold opacity-50 tracking-tighter">Tax ({data.taxRate}%)</span>
                                <span className="text-sm font-mono text-destructive">+{data.currency} {taxValue.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-3 mt-1.5">
                                <span className="text-sm font-black uppercase tracking-tight">Total Due</span>
                                <span className={cn("text-2xl font-black transition-colors", templateStyles.accent)}>
                                    {data.currency} {data.amount}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>

            <div className={cn("p-6 border-t transition-colors grid grid-cols-2 gap-3", templateStyles.footer)}>
                <Button
                    variant="outline"
                    className="h-12 bg-background/50 border-2 rounded-xl group hover:border-primary transition-all gap-2"
                    onClick={() => onDownload("png")}
                >
                    <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="font-bold">PNG</span>
                </Button>
                <Button
                    variant="outline"
                    className="h-12 bg-background/50 border-2 rounded-xl group hover:border-primary transition-all gap-2"
                    onClick={() => onDownload("svg")}
                >
                    <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="font-bold">SVG</span>
                </Button>
                <Button
                    variant="default"
                    className="h-12 col-span-2 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all gap-2 bg-primary hover:bg-primary/90"
                    onClick={() => onDownload("pdf")}
                >
                    <FileText className="w-4 h-4" />
                    <span className="font-bold uppercase tracking-wider">Generate {data.templateId} Invoice</span>
                </Button>
            </div>

            {data.templateId !== 'minimal' && (
                <div className="absolute top-4 right-4 group">
                    <div className="flex items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Encrypted</span>
                    </div>
                </div>
            )}
        </Card>
    );
};
