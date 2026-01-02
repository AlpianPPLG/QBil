# QBilling

Aplikasi billing/invoice berbasis **Next.js App Router** untuk membuat invoice, mengelola template invoice (drag-drop), dan melakukan export laporan.

> Fokus utama proyek ini: **Invoice management + Template Builder + Export (PDF/ZIP/Merged PDF)**.

## Fitur Utama

### Invoice
- Buat invoice baru, edit, duplikasi, hapus
- Status invoice: `draft | sent | paid | void`
- Perhitungan subtotal/tax/total otomatis

### Export
- Export invoice **PDF (template-based / WYSIWYG)**
- Batch export:
  - **ZIP** berisi PDF per invoice
  - **Merged PDF** (1 file PDF gabungan) via server-side API

### Reports
- Laporan pajak (tax report) + export CSV
- Endpoint API: `GET /api/reports/tax`

### Template Builder (Drag–Drop)
- Builder v2: **drag & resize** block di canvas A4
- Snap grid untuk layout rapih
- Mode:
  - **Design**: edit layout
  - **Preview**: lihat hasil invoice dengan data preview
- Form kecil untuk edit **preview data**:
  - `merchantName`
  - `taxRate`
  - `items` (CRUD)

## Tech Stack
- Next.js 16 (App Router)
- TypeScript
- TailwindCSS
- shadcn/ui
- Vitest
- jsPDF + html2canvas (client PDF)
- JSZip (batch ZIP)
- Playwright + pdf-lib (server merged PDF)

## Struktur Folder (Ringkas)

- `src/app/` — route/pages (App Router)
  - `src/app/invoices/` — halaman invoice list/detail/edit/new
  - `src/app/templates/builder/` — template builder
  - `src/app/reports/` — reports UI
  - `src/app/api/` — API routes
    - `src/app/api/reports/tax/route.ts`
    - `src/app/api/export/invoices/merged/route.ts`

- `src/components/` — UI & feature components
  - `src/components/features/templates/InvoiceTemplateRenderer.tsx` — renderer invoice berbasis blocks

- `src/hooks/` — hooks untuk storage & export
  - `src/hooks/useInvoices.ts`
  - `src/hooks/useTemplates.ts`
  - `src/hooks/useExport.ts`

- `src/lib/` — schema, repo local storage, report logic, export utils
  - `src/lib/schema.ts`
  - `src/lib/storage/*Repo.ts`
  - `src/lib/export/*`

## Requirements
- Node.js (disarankan versi LTS)
- NPM

Jika ingin menggunakan fitur **Merged PDF (server-side)** pastikan instalasi browser Playwright sudah ada.

## Instalasi

```bash
npm install
```

### Install browser Playwright (untuk merged PDF)

```bash
npx playwright install chromium
```

## Menjalankan Aplikasi

### Development

```bash
npm run dev
```

Buka: http://localhost:3000

### Build

```bash
npm run build
npm run start
```

### Lint

```bash
npm run lint
```

### Test

```bash
npm run test
```

## Cara Pakai

### 1) Invoice
- Buka menu **Invoices**
- Klik **New invoice**
- Isi data merchant, items, tax, dll
- Simpan

### 2) Batch Export
Di halaman **Invoices**:
- centang beberapa invoice
- klik:
  - **Export ZIP** → menghasilkan `invoices-YYYY-MM-DD.zip` (PDF per invoice)
  - **Merged PDF** → menghasilkan `invoices-YYYY-MM-DD.pdf` (gabungan)

### 3) Template Builder
Buka **Templates → Builder**:
- **Design**: tambah block dan atur layout (drag & resize)
- **Preview**: lihat hasil render invoice menggunakan blocks yang sama
- Preview bisa pakai 2 sumber data:
  - **Template sample data (per-template)** → default, bisa kamu edit di panel kiri. Perubahannya otomatis tersimpan ke template itu.
  - **Invoice existing** → pilih dari dropdown **“Preview from invoice”** untuk pakai data invoice nyata (preview otomatis). Kosongkan dropdown untuk kembali ke sample data template.

## API Endpoints

### Tax report
- `GET /api/reports/tax`

### Merged PDF
- `POST /api/export/invoices/merged`
  - Body: `BillingData[]`
  - Response: `application/pdf`

> Catatan: karena data invoice saat ini disimpan di localStorage (client-side), endpoint merged PDF menerima payload data invoice dari client.

## Troubleshooting

### Merged PDF gagal / Playwright error
Pastikan chromium ter-install:

```bash
npx playwright install chromium
```

### Build gagal di halaman Template Builder
Halaman builder menggunakan `useSearchParams()` dan **dibungkus Suspense** + `dynamic = "force-dynamic"` agar aman saat build.

## Roadmap (Opsional)
- Template builder props yang lebih lengkap (font/align/padding/colors)
- Preview: pilih invoice existing sebagai sumber preview (DONE)
- Preview: simpan sample data per template (DONE)
- Template export yang benar-benar 1:1 di merged PDF (server-side render template blocks)
- Filter batch export (status/date range/currency)
