import React from "react";
import type { InvoiceStatus } from "@/lib/schema";
import { Badge } from "@/components/ui/badge";

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  switch (status) {
    case "paid":
      return <Badge className="bg-green-600/20 text-green-400 border-green-600/30">Paid</Badge>;
    case "sent":
      return <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30">Sent</Badge>;
    case "void":
      return <Badge variant="destructive">Void</Badge>;
    default:
      return <Badge variant="secondary">Draft</Badge>;
  }
}

