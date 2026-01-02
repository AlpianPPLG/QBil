import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/layout/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "QBilling Pro | Next-Gen Payments",
  description: "The ultimate billing studio for modern enterprises. Generate SEPA, Swiss, and UPI compliant QR invoices.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-[#050505] text-foreground antialiased selection:bg-primary/30`}>
        <Navbar />
        <div className="pt-16">
          {children}
        </div>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
