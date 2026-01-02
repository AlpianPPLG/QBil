"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BillingForm } from "@/components/features/billing/BillingForm";
import { QRPreview } from "@/components/features/billing/QRPreview";
import { useExport } from "@/hooks/useExport";
import { useBillingHistory } from "@/hooks/useBillingHistory";
import { useInvoices } from "@/hooks/useInvoices";
import { BillingData } from "@/lib/schema";
import {
    Clock,
    PlusCircle,
    Monitor,
    ChevronRight,
    Search,
    RefreshCcw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { generateReferenceId } from "@/lib/id";

function DashboardContent() {
    const searchParams = useSearchParams();
    const templateFromUrl = (searchParams.get("template") ?? undefined) as ("modern" | "classic" | "minimal" | "bold" | undefined);
    const router = useRouter();

    const [sessionId] = useState(() => new Date().toISOString().replace(/[-:.TZ]/g, "").slice(-8));
    const [initialReferenceId] = useState(() => generateReferenceId());

    const { history, saveToHistory, clearHistory } = useBillingHistory();
    const { exportAsPNG, exportAsSVG, exportAsPDF } = useExport();
    const { createInvoice } = useInvoices();

    const [billingData, setBillingData] = useState<BillingData>(() => {
        const savedMerchant = typeof window !== "undefined" ? localStorage.getItem("qbilling_merchant") : null;
        const merchant = savedMerchant ? (() => {
            try { return JSON.parse(savedMerchant) as { name?: string; address?: string; email?: string }; } catch { return {}; }
        })() : {};

        return {
            merchantName: merchant.name ?? "Acme Global Solutions",
            merchantAddress: merchant.address ?? "789 Enterprise Way, Silicon Valley, CA",
            merchantEmail: merchant.email ?? "billing@acme.global",
            amount: "0.00",
            currency: "USD",
            referenceId: initialReferenceId,
            note: "Subscription Payment - Q1 2024",
            qrColor: "#000000",
            backgroundColor: "#ffffff",
            errorCorrectionLevel: "M",
            logoUrl: "",
            standard: "generic",
            taxRate: 10,
            items: [
                { id: "1", description: "Premium Suite License", quantity: 1, price: 299.00 },
                { id: "2", description: "Cloud Storage Add-on", quantity: 2, price: 49.50 }
            ],
            templateId: templateFromUrl || "modern"
        };
    });

    const [searchHistory, setSearchHistory] = useState("");

    const handleDataChange = (newData: BillingData) => {
        setBillingData(newData);
    };

    const handleDownload = (format: "png" | "svg" | "pdf") => {
        if (format === "png") exportAsPNG("qr-code-element", billingData.referenceId || "qr-billing");
        else if (format === "svg") exportAsSVG("qr-code-element", billingData.referenceId || "qr-billing");
        else {
            saveToHistory(billingData);
            exportAsPDF(billingData);
        }
    };

    const loadHistory = (data: BillingData) => {
        setBillingData(data);
    };

    const filteredHistory = history.filter(h =>
        h.data.merchantName.toLowerCase().includes(searchHistory.toLowerCase()) ||
        h.data.referenceId.toLowerCase().includes(searchHistory.toLowerCase())
    );

    return (
        <div className="max-w-[1600px] mx-auto p-6 lg:p-10 grid grid-cols-12 gap-8 lg:gap-12">

            {/* LEFT SIDEBAR - HISTORY */}
            <div className="hidden xl:col-span-2 xl:block space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Recent Activity
                    </h2>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.3 h-3.3 text-muted-foreground" />
                    <Input
                        value={searchHistory}
                        onChange={(e) => setSearchHistory(e.target.value)}
                        placeholder="Find invoice..."
                        className="pl-9 h-9 text-xs bg-muted/20 border-border/40 focus:bg-background"
                    />
                </div>

                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
                    <AnimatePresence mode="popLayout">
                        {filteredHistory.length > 0 ? (
                            filteredHistory.map((item) => (
                                <motion.button
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    onClick={() => loadHistory(item.data)}
                                    className="w-full text-left p-3 rounded-xl bg-muted/10 border border-transparent hover:border-primary/30 hover:bg-primary/5 transition-all group relative"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-[10px] font-mono text-primary/70">{item.data.referenceId}</span>
                                        <span className="text-[9px] text-muted-foreground">{new Date(item.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-xs font-bold truncate group-hover:text-primary transition-colors">
                                        {item.data.merchantName}
                                    </p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-[10px] font-bold text-muted-foreground">{item.data.currency} {item.data.amount}</span>
                                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-primary" />
                                    </div>
                                </motion.button>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground italic text-xs">
                                No history found
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearHistory}
                    className="w-full text-[10px] text-muted-foreground hover:text-destructive gap-2"
                >
                    <RefreshCcw className="w-3 h-3" />
                    Clear Cached History
                </Button>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="col-span-12 xl:col-span-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

                {/* INPUT SECTION */}
                <div className="lg:col-span-7 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h2 className="text-3xl font-black tracking-tight">
                                Payment Link <span className="text-primary">Studio</span>
                            </h2>
                            <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold">
                                Session ID: {sessionId} • Verified Terminal
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                className="rounded-xl px-6 font-bold shadow-lg shadow-primary/20"
                                onClick={() => {
                                    const inv = createInvoice(billingData);
                                    router.push(`/invoices/${inv.id}`);
                                }}
                            >
                                Save Draft
                            </Button>
                            <Button variant="outline" size="sm" className="rounded-xl border-dashed border-2 px-6" onClick={() => window.location.reload()}>
                                <PlusCircle className="w-4 h-4 mr-2" />
                                Reset
                            </Button>
                        </div>
                    </div>

                    <BillingForm onChange={handleDataChange} initialData={billingData} />
                </div>

                {/* PREVIEW SECTION */}
                <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24 animate-in fade-in slide-in-from-right-4 duration-700 delay-200">
                    <QRPreview data={billingData} onDownload={handleDownload} />

                    <div className="p-6 rounded-3xl bg-primary/[0.03] border border-primary/10 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <Monitor className="w-4 h-4" />
                            </div>
                            <h4 className="text-sm font-bold">Smart Sync Technology</h4>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Selected template: <span className="text-primary font-bold uppercase">{billingData.templateId}</span>.
                            Your changes are automatically reflected in the real-time preview and stored in your browser&apos;s persistent cache.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <Badge variant="secondary" className="justify-center py-1">256-bit AES</Badge>
                            <Badge variant="secondary" className="justify-center py-1">SEPA Ready</Badge>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div className="p-20 text-center animate-pulse font-black text-2xl">LOADING ENGINE...</div>}>
            <DashboardContent />
        </Suspense>
    );
}
