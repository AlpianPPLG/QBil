"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap,
  ArrowRight,
  ShieldCheck,
  Globe2,
  Smartphone,
  Layout,
  Download,
  CheckCircle2,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden bg-[#050505]">
      {/* Ambient Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[600px] opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/40 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full" />
      </div>

      {/* HERO SECTION */}
      <section className="relative px-6 pt-24 pb-32 lg:pt-32 lg:pb-48 max-w-7xl mx-auto text-center">
        <motion.div {...stagger} initial="initial" animate="animate">
          <motion.div variants={fadeIn} className="flex justify-center mb-6">
            <Badge variant="outline" className="px-4 py-1.5 rounded-full bg-primary/5 text-primary border-primary/20 backdrop-blur-sm gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Now supporting UPI & Swiss QR
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeIn}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 leading-[0.9]"
          >
            THE FUTURE OF <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-blue-400">
              PAYMENT DESIGN
            </span>
          </motion.h1>

          <motion.p
            variants={fadeIn}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-medium"
          >
            Architecting high-fidelity billing experiences. Generate compliant,
            branded, and bank-ready QR invoices for global enterprises in seconds.
          </motion.p>

          <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-14 px-8 text-lg font-bold rounded-full shadow-2xl shadow-primary/30 group" asChild>
              <Link href="/dashboard">
                Launch Studio
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold rounded-full border-border/40 bg-white/5 backdrop-blur-md">
              Documentation
            </Button>
          </motion.div>
        </motion.div>

        {/* VISUAL TEASER */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="mt-24 relative mx-auto max-w-5xl group"
        >
          <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-[3rem] -z-10 group-hover:bg-primary/30 transition-colors duration-700" />
          <div className="rounded-[2.5rem] border border-white/10 bg-black/40 backdrop-blur-2xl p-4 lg:p-8 overflow-hidden shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-12 items-center">
              <div className="md:col-span-4 space-y-4 text-left p-4">
                <div className="space-y-2">
                  <div className="w-12 h-1 bg-primary rounded-full mb-4" />
                  <h3 className="text-2xl font-bold">Real-time Engine</h3>
                  <p className="text-sm text-muted-foreground">Synchronized rendering with 256-bit AES protection. Instant export to vector or high-res raster.</p>
                </div>
                <div className="space-y-4 pt-4">
                  {['SEPA & EPC Ready', 'Swiss QR Standard', 'UPI Interface', 'Vector SVG Output'].map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
              <div className="md:col-span-8 relative">
                <div className="aspect-video rounded-3xl bg-gradient-to-br from-zinc-900 to-black border border-white/5 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                  <div className="relative p-10 bg-white rounded-3xl rotate-2 shadow-2xl scale-75 lg:scale-100">
                    <Zap className="w-48 h-48 text-black opacity-10 absolute inset-0 m-auto" />
                    <div className="w-48 h-48 bg-black rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* FEATURES GRID */}
      <section className="px-6 py-24 max-w-7xl mx-auto relative">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">Enterprise Infrastructure</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Built for scale, speed, and precision. QBilling provides the tools professionals need.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<ShieldCheck className="w-6 h-6 text-green-400" />}
            title="Compliance First"
            desc="Automatically valid for ISO-20022 and SEPA standards. Bank-grade reliability baked into every export."
          />
          <FeatureCard
            icon={<Globe2 className="w-6 h-6 text-blue-400" />}
            title="Multi-Currency"
            desc="Support for over 150 fiat and crypto currencies with automated symbol mapping and decimal handling."
          />
          <FeatureCard
            icon={<Smartphone className="w-6 h-6 text-purple-400" />}
            title="Mobile Optimized"
            desc="Generated codes are stress-tested for scanning reliability across all modern smartphone devices."
          />
          <FeatureCard
            icon={<Layout className="w-6 h-6 text-orange-400" />}
            title="Template Studio"
            desc="Switch between Modern, Classic, and Minimalist invoice designs instantly without re-typing data."
          />
          <FeatureCard
            icon={<Download className="w-6 h-6 text-cyan-400" />}
            title="Batch Processing"
            desc="Generate hundreds of invoices from a single JSON schema. Built for developers and automation."
          />
          <FeatureCard
            icon={<Layers className="w-6 h-6 text-pink-400" />}
            title="White-label Ready"
            desc="Strip all QBilling branding and inject your own business identities for a seamless client experience."
          />
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="px-6 py-32 max-w-5xl mx-auto">
        <div className="rounded-[3rem] bg-primary p-12 lg:p-24 text-center space-y-8 relative overflow-hidden group">
          <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-700 -z-10" />
          <h2 className="text-4xl md:text-6xl font-black text-primary-foreground tracking-tighter">
            READY TO LEVEL UP <br /> YOUR BILLING?
          </h2>
          <p className="text-primary-foreground/80 text-lg lg:text-xl font-medium max-w-2xl mx-auto">
            Join over 5,000+ developers and small businesses utilizing our high-end generation engine.
          </p>
          <Button size="lg" variant="secondary" className="h-16 px-12 text-xl font-black rounded-full shadow-2xl" asChild>
            <Link href="/dashboard">Create Invoice Now</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-8 rounded-[2rem] border border-border/40 bg-card/40 backdrop-blur-xl hover:border-primary/50 transition-all duration-300 group">
      <div className="w-12 h-12 rounded-2xl bg-background border border-border/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}
