"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Palette, Zap, CheckCircle2, Star, Wrench } from "lucide-react";
import { motion } from "framer-motion";

const templates = [
    {
        id: "modern",
        name: "Pro Modern",
        description: "Standard corporate look with accent colors and clean typography.",
        preview: "from-blue-600 to-indigo-700",
        features: ["Clean Typography", "Accent Highlights", "Table Layout"],
        popular: true
    },
    {
        id: "classic",
        name: "Classic Merchant",
        description: "A traditional invoice style favored by banks and retail businesses.",
        preview: "from-zinc-700 to-zinc-900",
        features: ["B&W Optimized", "Standard Headers", "Traditional Grid"],
        popular: false
    },
    {
        id: "minimal",
        name: "Zen Minimal",
        description: "Ultra-clean design that focuses strictly on the QR code and total.",
        preview: "from-emerald-500 to-teal-700",
        features: ["High Contrast", "Reduced Noise", "Essential Data Only"],
        popular: false
    },
    {
        id: "bold",
        name: "Bold Impact",
        description: "Heavy weight fonts and large visual elements for a modern tech feel.",
        preview: "from-orange-500 to-red-600",
        features: ["Large Heading", "Vibrant Gradients", "Rounded aesthetics"],
        popular: false
    }
];

export default function TemplatesPage() {
    return (
        <div className="max-w-7xl mx-auto p-6 lg:p-12 space-y-12">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
                <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 px-4 py-1">Style Library</Badge>
                <h1 className="text-5xl font-black tracking-tighter">SELECT YOUR <span className="text-primary">STYLE</span></h1>
                <p className="text-muted-foreground">Pick a template that matches your brand identity. You can always switch styles inside the editor without losing your data.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {templates.map((template, index) => (
                    <motion.div
                        key={template.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group"
                    >
                        <Card className="h-full border-none bg-card/40 backdrop-blur-xl shadow-2xl hover:bg-card/60 transition-all duration-300 flex flex-col overflow-hidden relative">
                            {template.popular && (
                                <div className="absolute top-4 right-4 z-10">
                                    <Badge className="bg-primary text-primary-foreground gap-1.5 font-bold shadow-lg">
                                        <Star className="w-3 h-3 fill-current" />
                                        Popular
                                    </Badge>
                                </div>
                            )}

                            <div className={`h-48 bg-gradient-to-br ${template.preview} relative overflow-hidden`}>
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                                <div className="absolute inset-0 flex items-center justify-center translate-y-8 group-hover:translate-y-4 transition-transform duration-500">
                                    <div className="w-32 h-40 bg-white/90 rounded-t-xl shadow-2xl p-3">
                                        <div className="w-full h-2 bg-zinc-300 rounded-full mb-3" />
                                        <div className="w-3/4 h-2 bg-zinc-200 rounded-full mb-6" />
                                        <div className="w-full h-24 bg-zinc-100 rounded-lg flex items-center justify-center">
                                            <Zap className="w-8 h-8 text-zinc-300" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <CardHeader>
                                <CardTitle className="text-2xl font-black tracking-tight">{template.name}</CardTitle>
                                <CardDescription className="text-xs leading-relaxed">{template.description}</CardDescription>
                            </CardHeader>

                            <CardContent className="flex-grow space-y-3">
                                {template.features.map(f => (
                                    <div key={f} className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                                        {f}
                                    </div>
                                ))}
                            </CardContent>

                            <CardFooter className="pt-0">
                                <Button className="w-full rounded-xl group-hover:bg-primary shadow-lg transition-colors font-bold" asChild>
                                    <Link href={`/dashboard?template=${template.id}`}>
                                        Use Template
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="p-12 rounded-[3rem] bg-muted/20 border border-dashed border-border/60 text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-background border flex items-center justify-center mx-auto">
                    <Palette className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-2xl font-bold">Build your own template</h3>
                    <p className="text-muted-foreground text-sm max-w-lg mx-auto">Create custom invoice layouts with the new drag-drop builder (v1 grid editor).</p>
                </div>
                <div className="flex items-center justify-center gap-3">
                    <Button className="rounded-full shadow-md" asChild>
                        <Link href="/templates/builder">
                            <Wrench className="w-4 h-4 mr-2" />
                            Open Builder
                        </Link>
                    </Button>
                    <Button variant="outline" className="rounded-full shadow-md">Contact Design Team</Button>
                </div>
            </div>
        </div>
    );
}
