import Header from "@/components/Header";
import FaqAccordion from "@/components/FaqAccordion";

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-background-800 text-foreground-100">
      <Header />
      <main>
        <section className="relative pt-[72px] bg-background-900 border-b border-background-200/60">
          <div className="absolute inset-0 grid-overlay opacity-20 pointer-events-none"></div>
          <div className="relative w-full max-w-[1440px] mx-auto px-6 md:px-10 py-20 md:py-24">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-px bg-primary-500/60"></span>
              <span className="font-mono text-[10px] tracking-[0.28em] text-primary-500 uppercase">FAQ</span>
            </div>
            <h1 className="font-display text-[44px] md:text-[60px] leading-[0.95] tracking-tightest text-foreground-100 mb-4">
              Frequently asked questions.
            </h1>
            <p className="text-[15px] text-foreground-400 max-w-lg">
              Everything researchers ask before and after their first order. If you need something not covered here, our team responds within 24 hours.
            </p>
          </div>
        </section>
        <FaqAccordion />
      </main>
      
    </div>
  );
}
