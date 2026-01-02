"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, LayoutDashboard, BarChart3, Layers, Settings, Github, Receipt, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Invoices", href: "/invoices", icon: Receipt },
    { name: "Reports", href: "/reports", icon: FileText },
    { name: "Templates", href: "/templates", icon: Layers },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Settings", href: "/settings", icon: Settings },
];

export const Navbar = () => {
    const pathname = usePathname();

    return (
        <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-border/40 bg-background/80 backdrop-blur-xl">
            <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-10">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
                            <Zap className="w-5 h-5 text-primary-foreground fill-primary-foreground" />
                        </div>
                        <span className="text-xl font-black tracking-tighter">
                            QBILLING<span className="text-primary italic">.PRO</span>
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 relative",
                                        isActive
                                            ? "text-primary"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.name}
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-glow"
                                            className="absolute inset-0 bg-primary/10 rounded-lg -z-10"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="hidden sm:flex" asChild>
                        <a href="https://github.com" target="_blank" rel="noreferrer">
                            <Github className="w-5 h-5" />
                        </a>
                    </Button>
                    <Separator orientation="vertical" className="h-4 mx-2 hidden sm:block" />
                    <Button size="sm" className="rounded-full px-5 font-bold shadow-lg shadow-primary/20" asChild>
                        <Link href="/dashboard">Get Started</Link>
                    </Button>
                </div>
            </div>
        </nav>
    );
};

const Separator = ({ className, orientation = "horizontal" }: { className?: string, orientation?: "horizontal" | "vertical" }) => (
    <div className={cn("bg-border", orientation === "horizontal" ? "h-[1px] w-full" : "w-[1px] h-full", className)} />
);
