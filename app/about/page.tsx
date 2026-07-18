import Header from "@/components/Header";
import PromoBanner from "@/components/PromoBanner";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background-800 text-foreground-100"><PromoBanner /><Header /><main className="pt-[112px]"><section className="pt-[112px] bg-background-900 border-b border-background-200/60"><div className="w-full max-w-[1440px] mx-auto px-6 md:px-10 py-12"><div className="flex items-center gap-3 mb-3"><span className="w-8 h-px bg-primary-500/60"></span><span className="font-mono text-[10px] tracking-[0.28em] text-primary-500 uppercase">About</span></div><h1 className="font-display text-[36px] md:text-[44px] leading-[0.95] tracking-tightest text-foreground-100">About Vertalis Labs</h1></div></section><section className="w-full max-w-[1440px] mx-auto px-6 md:px-10 py-20"><div className="max-w-3xl mx-auto text-center"><p className="text-[16px] text-foreground-400 leading-relaxed mb-6">Vertalis Labs is a dedicated supplier of high-purity research peptides and biochemicals for laboratory use. Every product undergoes rigorous third-party analytical verification to ensure purity, identity, and composition meet the highest standards.</p><p className="text-[14px] text-foreground-500 leading-relaxed">This page is under construction. Full content coming soon.</p></div></section></main></div>
  );
}
