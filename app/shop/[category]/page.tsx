import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import PromoBanner from "@/components/PromoBanner";
import ProductCard from "@/components/ProductCard";
import { PRODUCTS } from "@/data/products";

const SLUG_TO_CATEGORY: Record<string, string> = {
  "peptides": "Peptides",
  "fat-loss-metabolic": "Fat Loss & Metabolic",
  "recovery-repair": "Recovery & Repair",
  "longevity": "Longevity",
  "cognitive": "Cognitive",
  "peptide-blends": "Peptide Blends",
  "research-supplies": "Research Supplies",
};

const CATEGORY_DESC: Record<string, string> = {
  "Peptides": "High-purity peptide sequences for receptor binding and signaling pathway research.",
  "Fat Loss & Metabolic": "GLP-1 receptor agonists, lipolytic sequences, and metabolic pathway research compounds.",
  "Recovery & Repair": "Tissue repair, wound healing, and regenerative signaling compounds for laboratory research.",
  "Longevity": "Cellular, mitochondrial, and telomere research peptides for longevity science.",
  "Cognitive": "Neurotropic sequences for synaptic plasticity, BDNF signaling, and cognitive research.",
  "Peptide Blends": "Precision-formulated multi-compound blends for complex research protocols.",
  "Research Supplies": "Bacteriostatic water, reconstitution supplies, and laboratory essentials.",
};

export function generateStaticParams() {
  return Object.keys(SLUG_TO_CATEGORY).map((category) => ({ category }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const categoryName = SLUG_TO_CATEGORY[category];
  if (!categoryName) notFound();

  const products = PRODUCTS.filter((p) => !p.hidden && p.category === categoryName);

  return (
    <div className="min-h-screen bg-background-800 text-foreground-100">
      <PromoBanner /><Header />
      <main>
        {/* Hero */}
        <section className="relative pt-[112px] bg-background-900 border-b border-background-200/60">
          <div className="absolute inset-0 grid-overlay opacity-20 pointer-events-none"></div>
          <div className="relative w-full max-w-[1440px] mx-auto px-6 md:px-10 py-14 md:py-16">
            <nav className="flex items-center gap-2 text-[12px] text-foreground-500 font-mono mb-6">
              <Link href="/" className="hover:text-primary-500 transition-colors">Home</Link>
              <span>/</span>
              <Link href="/shop" className="hover:text-primary-500 transition-colors">Shop</Link>
              <span>/</span>
              <span className="text-primary-500">{categoryName}</span>
            </nav>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-8 h-px bg-primary-500/60"></span>
              <span className="font-mono text-[10px] tracking-[0.28em] text-primary-500 uppercase">Category</span>
            </div>
            <h1 className="font-display text-[40px] md:text-[54px] leading-[0.95] tracking-tightest text-foreground-100 mb-4">
              {categoryName}
            </h1>
            <p className="text-[14px] text-foreground-500 max-w-lg">{CATEGORY_DESC[categoryName]}</p>
            <div className="flex items-center gap-3 mt-6">
              <span className="font-mono text-[11px] text-foreground-600">{products.length} compound{products.length !== 1 ? "s" : ""} available</span>
              <span className="w-px h-3 bg-background-300"></span>
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-secondary-500">
                <i className="ri-shield-check-line text-[12px]"></i>All batches COA verified
              </span>
            </div>
          </div>
        </section>

        {/* Product grid */}
        <section className="w-full max-w-[1440px] mx-auto px-6 md:px-10 py-16">
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {products.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <i className="ri-flask-line text-[48px] text-foreground-600 mb-4"></i>
              <p className="text-foreground-400 text-[15px] mb-2">No products currently in this category.</p>
              <Link href="/shop" className="mt-4 h-9 px-5 rounded-md bg-primary-500 text-background-900 text-[13px] font-semibold hover:bg-primary-400 transition-all cursor-pointer">
                Browse all compounds
              </Link>
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="border-t border-background-200/60 bg-background-900/50 py-14">
          <div className="w-full max-w-[1440px] mx-auto px-6 md:px-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="font-display text-[24px] text-foreground-100 mb-1">Need a different compound?</h2>
              <p className="text-[14px] text-foreground-500">Browse our full research catalog or contact us for custom bulk orders.</p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link href="/shop" className="h-10 px-6 rounded-md bg-primary-500 text-background-900 text-[13px] font-semibold hover:bg-primary-400 transition-all cursor-pointer inline-flex items-center gap-2">
                <i className="ri-apps-line text-[14px]"></i>Full Catalog
              </Link>
              <Link href="/contact" className="h-10 px-6 rounded-md border border-background-200 text-[13px] text-foreground-300 hover:border-primary-500 hover:text-primary-500 transition-all cursor-pointer inline-flex items-center gap-2">
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      </main>
      
    </div>
  );
}
