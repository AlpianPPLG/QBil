"use client";

import React, { useMemo } from "react";
import { useBillingHistory } from "@/hooks/useBillingHistory";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    AreaChart,
    Area
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    TrendingUp,
    History,
    PieChart as PieIcon,
    Activity,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AnalyticsPage() {
    const { history } = useBillingHistory();

    const stats = useMemo(() => {
        if (history.length === 0) return null;

        const totalAmount = history.reduce((acc, curr) => acc + parseFloat(curr.data.amount), 0);
        const avgAmount = totalAmount / history.length;

        // Group by currency
        const currencyMap = history.reduce<Record<string, number>>((acc, curr) => {
            acc[curr.data.currency] = (acc[curr.data.currency] || 0) + parseFloat(curr.data.amount);
            return acc;
        }, {});

        const currencyData = Object.keys(currencyMap).map(k => ({ name: k, value: currencyMap[k] }));

        // Group by date (last 7 entries for chart)
        const timelineData = history.slice(0, 7).reverse().map(h => ({
            name: new Date(h.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
            amount: parseFloat(h.data.amount)
        }));

        return { totalAmount, avgAmount, currencyData, timelineData, count: history.length };
    }, [history]);

    if (!stats) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
                <div className="w-24 h-24 rounded-full bg-muted/20 flex items-center justify-center animate-pulse">
                    <Activity className="w-10 h-10 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black">Pulse Terminal Offline</h2>
                    <p className="text-muted-foreground max-w-sm">No billing activity detected. Start generating invoices in the dashboard to see live market data.</p>
                </div>
                <Badge variant="outline" className="border-dashed py-1 px-4">Waiting for incoming data...</Badge>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto p-6 lg:p-12 space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tighter">ANALYTICS <span className="text-primary">CORE</span></h1>
                    <p className="text-muted-foreground font-medium">Visualization of your local billing operations and cashflow.</p>
                </div>
                <div className="flex gap-4">
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex flex-col items-end">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Total Volume</span>
                        <span className="text-2xl font-black">{stats.totalAmount.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* KPI GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Success Rate" value="100%" trend="+0%" icon={<ShieldCheck />} color="text-green-500" />
                <KPICard title="Average Ticket" value={stats.avgAmount.toFixed(2)} trend="+12.4%" icon={<TrendingUp />} color="text-primary" />
                <KPICard title="Total Transactions" value={stats.count.toString()} trend="+2" icon={<History />} color="text-blue-500" />
                <KPICard title="Active Channels" value={`${stats.currencyData.length} Currencies`} trend="Stable" icon={<Globe2 />} color="text-purple-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* TIMELINE CHART */}
                <Card className="lg:col-span-8 border-none shadow-2xl bg-card/40 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" />
                            Revenue Stream
                        </CardTitle>
                        <CardDescription>Visualizing the last 7 billing events</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px] pt-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.timelineData}>
                                <defs>
                                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                                    itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* PIE CHART */}
                <Card className="lg:col-span-4 border-none shadow-2xl bg-card/40 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieIcon className="w-5 h-5 text-purple-500" />
                            Asset Allocation
                        </CardTitle>
                        <CardDescription>Currency distribution by volume</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px] flex flex-col justify-center">
                        <ResponsiveContainer width="100%" height="70%">
                            <PieChart>
                                <Pie
                                    data={stats.currencyData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {stats.currencyData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            {stats.currencyData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    {entry.name}: {entry.value.toFixed(0)}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

const COLORS = ['#adfa1d', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316'];

type IconEl = React.ReactElement<{ className?: string }>;

function KPICard({ title, value, trend, icon, color }: { title: string, value: string, trend: string, icon: IconEl, color: string }) {
    return (
        <Card className="border-none bg-card/40 shadow-xl overflow-hidden relative group hover:bg-card/60 transition-colors">
            <div className={`absolute top-0 left-0 w-1 h-full bg-current ${color}`} />
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-2.5 rounded-xl bg-background border border-border/40 ${color}`}>
                        {React.cloneElement(icon, { className: "w-5 h-5" })}
                    </div>
                    <Badge variant="outline" className="rounded-full text-[10px] font-bold bg-muted/20 border-border/40 gap-1.5">
                        {trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3 text-green-400" /> : <ArrowDownRight className="w-3 h-3 text-red-400" />}
                        {trend}
                    </Badge>
                </div>
                <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
                    <h3 className="text-3xl font-black">{value}</h3>
                </div>
            </CardContent>
        </Card>
    );
}

function ShieldCheck({ className }: { className?: string }) {
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" /></svg>;
}

function Globe2({ className }: { className?: string }) {
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>;
}
