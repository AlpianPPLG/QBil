import { useState, useCallback } from "react";
import { BillingData } from "@/lib/schema";

interface HistoryEntry {
    id: string;
    timestamp: number;
    data: BillingData;
}

export const useBillingHistory = () => {
    const [history, setHistory] = useState<HistoryEntry[]>(() => {
        const saved = typeof window !== "undefined" ? localStorage.getItem("qbilling_history") : null;
        if (!saved) return [];
        try {
            return JSON.parse(saved) as HistoryEntry[];
        } catch (e) {
            console.error("Failed to parse history", e);
            return [];
        }
    });

    const saveToHistory = useCallback((data: BillingData) => {
        const entry: HistoryEntry = {
            id: data.referenceId || new Date().toISOString(),
            timestamp: Date.now(),
            data: { ...data }
        };

        setHistory(prev => {
            const updated = [entry, ...prev.filter(h => h.id !== entry.id)].slice(0, 20); // Keep last 20
            localStorage.setItem("qbilling_history", JSON.stringify(updated));
            return updated;
        });
    }, []);

    const removeFromHistory = useCallback((id: string) => {
        setHistory(prev => {
            const updated = prev.filter(h => h.id !== id);
            localStorage.setItem("qbilling_history", JSON.stringify(updated));
            return updated;
        });
    }, []);

    const clearHistory = useCallback(() => {
        localStorage.removeItem("qbilling_history");
        setHistory([]);
    }, []);

    return { history, saveToHistory, removeFromHistory, clearHistory };
};
