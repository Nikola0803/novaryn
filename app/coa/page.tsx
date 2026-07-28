import type { Metadata } from "next";
import Header from "@/components/Header";
import PromoBanner from "@/components/PromoBanner";
import CoaGrid, { type CoaRecord } from "@/components/CoaGrid";

export const metadata: Metadata = {
  title: "COA Archive",
  description:
    "Every Vertalis Certificate of Analysis, publicly searchable by batch code. Independent third-party lab results for every compound we ship.",
  alternates: { canonical: "/coa" },
};

const COA_RECORDS: CoaRecord[] = [
  { batchCode: "NVR-24-1112-A", product: "MOTS-c", category: "Fat Loss & Metabolic", purity: "99.19%", testDate: "2024-11-12", labRef: "JAN-2024-11-4791" },
  { batchCode: "NVR-24-1111-C", product: "Longevity Stack", category: "Peptide Blends", purity: "99.60%", testDate: "2024-11-11", labRef: "SIM-2024-11-2231" },
  { batchCode: "NVR-24-1110-B", product: "NAD+", category: "Longevity", purity: "99.81%", testDate: "2024-11-10", labRef: "JAN-2024-11-4788" },
  { batchCode: "NVR-24-1109-B", product: "Semaglutide", category: "Fat Loss & Metabolic", purity: "99.38%", testDate: "2024-11-09", labRef: "JAN-2024-11-4785" },
  { batchCode: "NVR-24-1108-A", product: "Semaglutide", category: "Fat Loss & Metabolic", purity: "99.42%", testDate: "2024-11-08", labRef: "JAN-2024-11-4782" },
  { batchCode: "NVR-24-1107-B", product: "Recovery Stack", category: "Peptide Blends", purity: "99.51%", testDate: "2024-11-07", labRef: "SIM-2024-11-2227" },
  { batchCode: "NVR-24-1106-A", product: "Ipamorelin", category: "Recovery & Repair", purity: "99.35%", testDate: "2024-11-06", labRef: "ANR-2024-11-1163" },
  { batchCode: "NVR-24-1105-D", product: "GHK-Cu", category: "Longevity", purity: "99.74%", testDate: "2024-11-05", labRef: "JAN-2024-11-4776" },
  { batchCode: "NVR-24-1104-D", product: "CJC-1295", category: "Recovery & Repair", purity: "99.55%", testDate: "2024-11-04", labRef: "ANR-2024-11-1159" },
  { batchCode: "NVR-24-1102-C", product: "BPC-157", category: "Recovery & Repair", purity: "99.68%", testDate: "2024-11-02", labRef: "ANR-2024-11-1155" },
  { batchCode: "NVR-24-1101-A", product: "Semax", category: "Cognitive", purity: "99.27%", testDate: "2024-11-01", labRef: "JAN-2024-11-4768" },
  { batchCode: "NVR-24-1029-B", product: "TB-500", category: "Recovery & Repair", purity: "99.51%", testDate: "2024-10-29", labRef: "ANR-2024-10-1148" },
  { batchCode: "NVR-24-1027-C", product: "Selank", category: "Cognitive", purity: "99.45%", testDate: "2024-10-27", labRef: "JAN-2024-10-4751" },
  { batchCode: "NVR-24-1026-E", product: "Retatrutide", category: "Fat Loss & Metabolic", purity: "99.44%", testDate: "2024-10-26", labRef: "JAN-2024-10-4747" },
  { batchCode: "NVR-24-1024-A", product: "Epitalon", category: "Longevity", purity: "99.60%", testDate: "2024-10-24", labRef: "SIM-2024-10-2198" },
  { batchCode: "NVR-24-1023-AC", product: "Bacteriostatic Water", category: "Accessories", purity: "USP Grade", testDate: "2024-10-23", labRef: "ANR-2024-10-1139" },
  { batchCode: "NVR-24-1019-D", product: "NSI-189", category: "Cognitive", purity: "99.59%", testDate: "2024-10-19", labRef: "JAN-2024-10-4732" },
  { batchCode: "NVR-24-1031-F", product: "Tirzepatide", category: "Fat Loss & Metabolic", purity: "99.62%", testDate: "2024-10-31", labRef: "JAN-2024-10-4759" },
];

export default function CoaPage() {
  return (
    <div className="min-h-screen bg-background-800 text-foreground-100">
      <PromoBanner /><Header />
      <main>
        <section className="relative pt-[112px] bg-background-900 border-b border-background-200/60">
          <div className="absolute inset-0 grid-overlay opacity-20 pointer-events-none"></div>
          <div className="absolute top-24 right-10 w-80 h-80 rounded-full bg-primary-500/5 blur-[120px] pointer-events-none"></div>
          <div className="relative w-full max-w-[1440px] mx-auto px-6 md:px-10 py-14 md:py-16">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-8 h-px bg-primary-500/60"></span>
              <span className="font-mono text-[10px] tracking-[0.28em] text-primary-500 uppercase">Transparency</span>
            </div>
            <h1 className="font-display text-[38px] md:text-[52px] leading-[0.95] tracking-tightest text-foreground-100">COA Archive</h1>
            <p className="mt-3 text-[14px] text-foreground-500 max-w-lg">
              Every Certificate of Analysis, publicly searchable by batch code. {COA_RECORDS.length} records archived and counting.
            </p>
          </div>
        </section>

        <CoaGrid records={COA_RECORDS} />
      </main>
    </div>
  );
}
