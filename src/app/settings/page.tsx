"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    User,
    Shield,
    Bell,
    Save,
    Settings as SettingsIcon,
    Trash2,
    Database,
    Fingerprint
} from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

type IconEl = React.ReactElement<{ className?: string }>;

export default function SettingsPage() {
    const [merchant, setMerchant] = useState(() => {
        const fallback = {
            name: "",
            address: "",
            email: "",
            currency: "USD"
        };
        const saved = typeof window !== "undefined" ? localStorage.getItem("qbilling_merchant") : null;
        if (!saved) return fallback;
        try {
            return { ...fallback, ...(JSON.parse(saved) as Partial<typeof fallback>) };
        } catch {
            return fallback;
        }
    });

    const saveSettings = () => {
        localStorage.setItem("qbilling_merchant", JSON.stringify(merchant));
        toast.success("Identity settings preserved locally");
    };

    const clearLocalData = () => {
        localStorage.clear();
        toast.error("All local cache and history purged");
        window.location.reload();
    };

    return (
        <div className="max-w-4xl mx-auto p-6 lg:p-12 space-y-10">
            <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
                    TERMINAL <span className="text-primary">SETTINGS</span>
                </h1>
                <p className="text-muted-foreground">Configure your operational environment and persistent identity.</p>
            </div>

            <div className="grid gap-8">
                {/* MERCHANT IDENTITY */}
                <Card className="border-none bg-card/40 backdrop-blur-xl shadow-2xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            Merchant Identity
                        </CardTitle>
                        <CardDescription>Default data used for all new billing session generators.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Default Business Name</Label>
                                <Input
                                    value={merchant.name}
                                    onChange={(e) => setMerchant({ ...merchant, name: e.target.value })}
                                    placeholder="Acme Corp"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Billing Email</Label>
                                <Input
                                    value={merchant.email}
                                    onChange={(e) => setMerchant({ ...merchant, email: e.target.value })}
                                    placeholder="finance@acme.com"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Registered Address</Label>
                            <Input
                                value={merchant.address}
                                onChange={(e) => setMerchant({ ...merchant, address: e.target.value })}
                                placeholder="123 Business Way, New York"
                            />
                        </div>
                        <Button onClick={saveSettings} className="gap-2 rounded-xl">
                            <Save className="w-4 h-4" />
                            Save Merchant Profile
                        </Button>
                    </CardContent>
                </Card>

                {/* PRIVACY & DATA */}
                <Card className="border-none bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-green-500" />
                            Privacy & Local Storage
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/40">
                            <div className="space-y-0.5">
                                <p className="font-bold text-sm">Save Billing History</p>
                                <p className="text-xs text-muted-foreground">Automatically keep a local record of generated invoices.</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/40">
                            <div className="space-y-0.5">
                                <p className="font-bold text-sm">Hardware Acceleration</p>
                                <p className="text-xs text-muted-foreground">Use GPU for high-fidelity QR rendering (Recommended).</p>
                            </div>
                            <Switch defaultChecked />
                        </div>

                        <Separator />

                        <div className="p-6 rounded-2xl bg-destructive/5 border border-destructive/10 space-y-4">
                            <div className="flex items-center gap-2 text-destructive font-bold text-sm">
                                <Trash2 className="w-4 h-4" />
                                Dangerous Operations
                            </div>
                            <p className="text-xs text-muted-foreground">Purging local data will delete your merchant profile and all invoice history permanently. This action cannot be undone.</p>
                            <Button variant="destructive" size="sm" onClick={clearLocalData} className="rounded-lg">
                                Wipe All Local Data
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* SYSTEM INFO */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <SystemStat icon={<Database />} label="Cache Usage" value="1.2 MB" />
                    <SystemStat icon={<Fingerprint />} label="Auth Status" value="Local" />
                    <SystemStat icon={<Bell />} label="Notifs" value="Active" />
                    <SystemStat icon={<SettingsIcon />} label="Version" value="v2.0.1-b" />
                </div>
            </div>
        </div>
    );
}

function SystemStat({ icon, label, value }: { icon: IconEl, label: string, value: string }) {
    return (
        <div className="p-4 rounded-2xl bg-muted/10 border border-border/40 flex flex-col items-center justify-center text-center space-y-2">
            <div className="text-muted-foreground">
                {React.cloneElement(icon as IconEl, { className: "w-4 h-4" })}
            </div>
            <div className="space-y-0.5">
                <p className="text-[10px] uppercase tracking-tighter font-bold text-muted-foreground">{label}</p>
                <p className="font-black text-xs">{value}</p>
            </div>
        </div>
    );
}
