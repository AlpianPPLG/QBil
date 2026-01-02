/* eslint-disable react-hooks/incompatible-library */

"use client";

import React from "react";
import { useForm, useFieldArray, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { billingSchema, type BillingData } from "@/lib/schema";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Palette,
    Receipt,
    Plus,
    Trash2,
    User,
    Settings,
    Calculator,
    Image as ImageIcon
} from "lucide-react";
import { generateReferenceId } from "@/lib/id";
import type { z } from "zod";

interface BillingFormProps {
    onChange: (data: BillingData) => void;
    initialData?: Partial<BillingData>;
}

type BillingFormValues = z.infer<typeof billingSchema>;

export const BillingForm: React.FC<BillingFormProps> = ({ onChange, initialData }) => {
    const [defaultReferenceId] = React.useState(() => generateReferenceId());

    const form = useForm<BillingFormValues>({
        resolver: zodResolver(billingSchema) as unknown as Resolver<BillingFormValues>,
        defaultValues: {
            merchantName: "",
            merchantAddress: "",
            merchantEmail: "",
            amount: "0.00",
            currency: "USD",
            referenceId: defaultReferenceId,
            note: "",
            qrColor: "#000000",
            backgroundColor: "#ffffff",
            errorCorrectionLevel: "M",
            logoUrl: "",
            standard: "generic",
            taxRate: 0,
            items: [],
            templateId: "modern",
            ...initialData,
        } as BillingFormValues,
        mode: "onChange",
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    // Auto-calculate total amount
    const watchedItemsRaw = useWatch({ control: form.control, name: "items" });
    const watchedItems = React.useMemo(() => watchedItemsRaw ?? [], [watchedItemsRaw]);

    const watchedTaxRateRaw = useWatch({ control: form.control, name: "taxRate" });
    const watchedTaxRate = React.useMemo(() => watchedTaxRateRaw ?? 0, [watchedTaxRateRaw]);

    React.useEffect(() => {
        const subtotal = watchedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const total = subtotal * (1 + (Number(watchedTaxRate) / 100));
        form.setValue("amount", total.toFixed(2));
    }, [watchedItems, watchedTaxRate, form]);

    const formValues = useWatch({ control: form.control }) as BillingFormValues;

    React.useEffect(() => {
        onChange(formValues as unknown as BillingData);
    }, [formValues, onChange]);

    return (
        <Card className="border-none shadow-2xl bg-card/60 backdrop-blur-md overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary via-purple-500 to-blue-500" />
            <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-black flex items-center gap-2">
                    <Receipt className="w-6 h-6 text-primary" />
                    Generator Workspace
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form className="space-y-8">
                        <Tabs defaultValue="merchant" className="w-full">
                            <TabsList className="grid w-full grid-cols-4 lg:flex lg:w-fit mb-8 gap-1 p-1 bg-muted/50 rounded-xl">
                                <TabsTrigger value="merchant" className="rounded-lg gap-2">
                                    <User className="w-4 h-4" />
                                    <span className="hidden sm:inline">Merchant</span>
                                </TabsTrigger>
                                <TabsTrigger value="line-items" className="rounded-lg gap-2">
                                    <Calculator className="w-4 h-4" />
                                    <span className="hidden sm:inline">Items</span>
                                </TabsTrigger>
                                <TabsTrigger value="config" className="rounded-lg gap-2">
                                    <Settings className="w-4 h-4" />
                                    <span className="hidden sm:inline">Config</span>
                                </TabsTrigger>
                                <TabsTrigger value="design" className="rounded-lg gap-2">
                                    <Palette className="w-4 h-4" />
                                    <span className="hidden sm:inline">Design</span>
                                </TabsTrigger>
                            </TabsList>

                            {/* MERCHANT SECTION */}
                            <TabsContent value="merchant" className="space-y-6 focus-visible:outline-none">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="merchantName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Business / Merchant Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Acme International" {...field} className="bg-background/50" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="merchantEmail"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Billing Email</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="billing@acme.com" {...field} className="bg-background/50" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="merchantAddress"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Physical Address</FormLabel>
                                            <FormControl>
                                                <Input placeholder="123 Financial District, NY" {...field} className="bg-background/50" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="referenceId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Invoice Number</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="INV-2024-001" {...field} className="bg-background/50" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="currency"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Currency</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-background/50">
                                                            <SelectValue placeholder="Select currency" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="USD">🇺🇸 USD - Dollar</SelectItem>
                                                        <SelectItem value="EUR">🇪🇺 EUR - Euro</SelectItem>
                                                        <SelectItem value="GBP">🇬🇧 GBP - Pound</SelectItem>
                                                        <SelectItem value="CHF">🇨🇭 CHF - Franc</SelectItem>
                                                        <SelectItem value="IDR">🇮🇩 IDR - Rupiah</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </TabsContent>

                            {/* LINE ITEMS SECTION */}
                            <TabsContent value="line-items" className="space-y-4 focus-visible:outline-none">
                                <div className="space-y-4">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="grid grid-cols-12 gap-3 items-end p-4 rounded-xl bg-background/40 border border-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="col-span-12 lg:col-span-6">
                                                <FormField
                                                    control={form.control}
                                                    name={`items.${index}.description`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Input placeholder="Service or product name" {...field} />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="col-span-4 lg:col-span-2">
                                                <FormField
                                                    control={form.control}
                                                    name={`items.${index}.quantity`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Input type="number" placeholder="Qty" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="col-span-5 lg:col-span-3">
                                                <FormField
                                                    control={form.control}
                                                    name={`items.${index}.price`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Input type="number" step="0.01" placeholder="Price" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="col-span-3 lg:col-span-1 flex justify-end">
                                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:bg-destructive/10">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="w-full border-dashed border-2 py-6 hover:bg-primary/5 transition-colors"
                                        onClick={() => append({ id: Math.random().toString(), description: "", quantity: 1, price: 0 })}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Line Item
                                    </Button>

                                    <div className="pt-4 space-y-2">
                                        <FormField
                                            control={form.control}
                                            name="taxRate"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between p-4 rounded-xl border bg-primary/5 border-primary/10">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base">Tax / VAT (%)</FormLabel>
                                                        <FormDescription>Applied to subtotal</FormDescription>
                                                    </div>
                                                    <Input type="number" className="w-24 bg-background" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            {/* CONFIG SECTION */}
                            <TabsContent value="config" className="space-y-6 focus-visible:outline-none">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="standard"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>QR Standard Logic</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-background/50">
                                                            <SelectValue placeholder="Standard" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="generic">Standard / Generic</SelectItem>
                                                        <SelectItem value="epc">EPC-QR (Europe SEPA)</SelectItem>
                                                        <SelectItem value="swiss">Swiss QR Code</SelectItem>
                                                        <SelectItem value="upi">UPI (India)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="templateId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Visual Template</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-background/50">
                                                            <SelectValue placeholder="Select Template" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="modern">Pro Modern</SelectItem>
                                                        <SelectItem value="classic">Classic Merchant</SelectItem>
                                                        <SelectItem value="minimal">Zen Minimal</SelectItem>
                                                        <SelectItem value="bold">Bold Impact</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="note"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Payment Note</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Memo, Project Name, etc." {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </TabsContent>

                            {/* DESIGN SECTION */}
                            <TabsContent value="design" className="space-y-8 focus-visible:outline-none">
                                <div className="grid grid-cols-2 gap-8">
                                    <FormField
                                        control={form.control}
                                        name="qrColor"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Foreground</FormLabel>
                                                <div className="flex gap-3 items-center">
                                                    <FormControl>
                                                        <Input type="color" className="w-14 h-14 p-1 rounded-lg cursor-pointer" {...field} />
                                                    </FormControl>
                                                    <div className="font-mono text-sm opacity-60 underline">{field.value}</div>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="backgroundColor"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Background</FormLabel>
                                                <div className="flex gap-3 items-center">
                                                    <FormControl>
                                                        <Input type="color" className="w-14 h-14 p-1 rounded-lg cursor-pointer" {...field} />
                                                    </FormControl>
                                                    <div className="font-mono text-sm opacity-60 underline">{field.value}</div>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="errorCorrectionLevel"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Error Correction</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-background/50">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="L">Low (7%)</SelectItem>
                                                    <SelectItem value="M">Medium (15%)</SelectItem>
                                                    <SelectItem value="Q">Quartile (25%)</SelectItem>
                                                    <SelectItem value="H">High (30%)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />

                                <div className="space-y-4 p-6 border rounded-2xl bg-muted/30 border-dashed">
                                    <div className="flex items-center gap-2 font-semibold">
                                        <ImageIcon className="w-5 h-5" />
                                        Custom Logo
                                    </div>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        className="bg-background"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    form.setValue("logoUrl", reader.result as string);
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </form>
                </Form>
            </CardContent>
            <div className="px-6 py-4 bg-muted/40 border-t flex items-center justify-between">
                <span className="text-sm text-muted-foreground font-medium">Automatic total:</span>
                <span className="text-xl font-black text-primary">
                    {watchedItems.length > 0 ? `${form.watch("currency")} ${form.watch("amount")}` : "--"}
                </span>
            </div>
        </Card>
    );
};
