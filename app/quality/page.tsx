import Link from "next/link";
import Header from "@/components/Header";

const STEPS = [
  { n: "01", icon: "ri-flask-line", title: "Sourcing", body: "All raw materials are procured exclusively from vetted synthesis partners operating under strict NDAs. Every supplier undergoes facility audit and documented chain-of-custody verification before we accept a single gram of material." },
  { n: "02", icon: "ri-test-tube-line", title: "Synthesis", body: "Peptides are synthesized via solid-phase peptide synthesis (SPPS) in ISO-controlled cleanroom environments. Sequence fidelity is verified at synthesis before lyophilization." },
  { n: "03", icon: "ri-microscope-line", title: "Internal QC", body: "Each batch undergoes internal quality control including visual inspection, moisture content (Karl Fischer), and preliminary identity screen before being submitted for external testing." },
  { n: "04", icon: "ri-search-eye-line", title: "Independent Testing", body: "Every lot is independently analyzed by our third-party laboratory partners using HPLC-UV, LC-MS/MS, and LAL endotoxin assay. Results are not released internally before testing clears." },
  { n: "05", icon: "ri-shield-check-line", title: "COA Publication", body: "Certificates of Analysis are published publicly and indexed by batch code the moment they pass all thresholds. No batch ships before its COA is live." },
  { n: "06", icon: "ri-truck-line", title: "Cold-Chain Dispatch", body: "Vials are sealed in inert atmosphere, packed in temperature-monitored insulated mailers with gel ice, and dispatched on a next-day cold-chain courier within 24h of payment confirmation." },
];

const LABS = [
  { name: "Janoshik Analytical", loc: "Czech Republic", tests: "HPLC, Mass Spec, Sequence ID", url: "https://janoshik.com" },
  { name: "SIMEC AG", loc: "Switzerland", tests: "HPLC-UV, LC-MS/MS, Karl Fischer", url: "https://simec.ch" },
  { name: "Anresco Laboratories", loc: "San Francisco, CA", tests: "Endotoxin (LAL), Microbial Limits, Heavy Metals", url: "https://anresco.com" },
];

export default function QualityPage() {
  return (
    <div className="min-h-screen bg-background-800 text-foreground-100">
      <Header />
      <main>
        {/* Hero */}
        <section className="relative pt-[72px] bg-background-900 border-b border-background-200/60">
          <div className="absolute inset-0 grid-overlay opacity-20 pointer-events-none"></div>
          <div className="absolute top-20 right-0 w-80 h-80 rounded-full bg-primary-500/5 blur-[120px] pointer-events-none"></div>
          <div className="relative w-full max-w-[1440px] mx-auto px-6 md:px-10 py-20 md:py-28">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-px bg-primary-500/60"></span>
              <span className="font-mono text-[10px] tracking-[0.28em] text-primary-500 uppercase">Quality & Verification</span>
            </div>
            <h1 className="font-display text-[44px] md:text-[64px] leading-[0.95] tracking-tightest text-foreground-100 mb-6 max-w-3xl">
              Six stages.<br /><span className="text-platinum">Nothing ships without them.</span>
            </h1>
            <p className="text-[16px] text-foreground-400 max-w-xl leading-relaxed">
              Every Novaryn batch passes a documented six-stage quality pipeline before it reaches your lab. No exceptions. No batch-skipping. No shortcuts.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              {["≥99% Purity Baseline", "100% Third-Party Verified", "Publicly Archived COAs", "Cold-Chain Guaranteed"].map((badge) => (
                <span key={badge} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-secondary-500/30 bg-secondary-500/5 font-mono text-[11px] text-secondary-500">
                  <i className="ri-checkbox-circle-fill text-[12px]"></i>{badge}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Pipeline steps */}
        <section className="relative py-24 md:py-32">
          <div className="w-full max-w-[1440px] mx-auto px-6 md:px-10">
            <div className="max-w-3xl mb-16">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-[10px] tracking-[0.28em] text-primary-500 uppercase">/ 01 · The Pipeline</span>
                <span className="w-8 h-px bg-primary-500/40"></span>
              </div>
              <h2 className="font-display text-[38px] md:text-[48px] leading-[1.02] tracking-tightest text-foreground-100">
                From raw material to your bench.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {STEPS.map((step) => (
                <div key={step.n} className="group relative rounded-xl bg-background-900/70 border border-background-200/60 p-6 hover:border-primary-500/30 transition-all duration-500">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="font-mono text-[10px] tracking-[0.2em] text-primary-500">{step.n}</span>
                    <span className="w-px h-3 bg-background-300"></span>
                    <div className="w-8 h-8 flex items-center justify-center rounded-md bg-primary-500/10 text-primary-500 group-hover:bg-primary-500 group-hover:text-background-900 transition-all duration-500">
                      <i className={`${step.icon} text-[16px]`}></i>
                    </div>
                  </div>
                  <h3 className="font-display text-[17px] text-foreground-100 mb-2">{step.title}</h3>
                  <p className="text-[13px] text-foreground-500 leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testing standards */}
        <section className="border-t border-background-200/60 bg-background-900/40 py-24 md:py-32">
          <div className="w-full max-w-[1440px] mx-auto px-6 md:px-10">
            <div className="max-w-3xl mb-16">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-[10px] tracking-[0.28em] text-primary-500 uppercase">/ 02 · Testing Methodology</span>
                <span className="w-8 h-px bg-primary-500/40"></span>
              </div>
              <h2 className="font-display text-[38px] md:text-[48px] leading-[1.02] tracking-tightest text-foreground-100">
                What every COA covers.
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { icon: "ri-microscope-line", title: "HPLC Purity", body: "High-performance liquid chromatography confirms purity ≥99.0%. Full chromatogram published in every COA." },
                { icon: "ri-scan-line", title: "LC-MS/MS Identity", body: "Liquid chromatography–mass spectrometry confirms molecular weight and sequence identity against theoretical values." },
                { icon: "ri-shield-flash-line", title: "Endotoxin (LAL)", body: "Limulus Amebocyte Lysate assay confirms endotoxin levels below 5 EU/mg — critical for in vitro research integrity." },
                { icon: "ri-close-circle-line", title: "Microbial Limits", body: "Microbial contamination screening ensures sterility for research applications requiring clean environments." },
              ].map((item) => (
                <div key={item.title} className="group relative rounded-xl bg-background-900/70 border border-background-200/60 p-6 hover:border-primary-500/25 transition-all duration-500">
                  <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary-500/10 text-primary-500 mb-4 group-hover:bg-primary-500/20 transition-colors">
                    <i className={`${item.icon} text-[18px]`}></i>
                  </div>
                  <h4 className="font-display text-[15px] text-foreground-100 mb-2">{item.title}</h4>
                  <p className="text-[13px] text-foreground-500 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testing partners */}
        <section id="partners" className="border-t border-background-200/60 py-24 md:py-32">
          <div className="w-full max-w-[1440px] mx-auto px-6 md:px-10">
            <div className="max-w-3xl mb-16">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-[10px] tracking-[0.28em] text-primary-500 uppercase">/ 03 · Testing Partners</span>
                <span className="w-8 h-px bg-primary-500/40"></span>
              </div>
              <h2 className="font-display text-[38px] md:text-[48px] leading-[1.02] tracking-tightest text-foreground-100">
                The labs behind every COA.
              </h2>
              <p className="mt-4 text-[15px] text-foreground-500 max-w-xl">
                We work exclusively with accredited, internationally recognized analytical laboratories. All are independent — they report results to us, not the other way around.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {LABS.map((lab) => (
                <a key={lab.name} href={lab.url} target="_blank" rel="noopener noreferrer"
                  className="group relative rounded-xl bg-background-900/70 border border-background-200/60 p-8 hover:border-primary-500/40 transition-all duration-500 cursor-pointer block">
                  <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary-500/10 text-primary-500 mb-5 group-hover:bg-primary-500 group-hover:text-background-900 transition-all duration-500">
                    <i className="ri-building-2-line text-[18px]"></i>
                  </div>
                  <h3 className="font-display text-[18px] text-foreground-100 mb-1 group-hover:text-primary-500 transition-colors">{lab.name}</h3>
                  <p className="font-mono text-[11px] text-primary-500 mb-3">{lab.loc}</p>
                  <p className="text-[13px] text-foreground-500">{lab.tests}</p>
                  <i className="ri-external-link-line absolute top-6 right-6 text-foreground-600 group-hover:text-primary-500 transition-colors text-[14px]"></i>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* COA CTA */}
        <section className="border-t border-background-200/60 bg-background-900/50 py-14">
          <div className="w-full max-w-[1440px] mx-auto px-6 md:px-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="font-display text-[24px] text-foreground-100 mb-1">Verify any batch in seconds.</h2>
              <p className="text-[14px] text-foreground-500">Enter a batch code from any Novaryn vial to retrieve the full COA.</p>
            </div>
            <Link href="/coa" className="shrink-0 h-10 px-6 rounded-md bg-primary-500 text-background-900 text-[13px] font-semibold hover:bg-primary-400 transition-all cursor-pointer inline-flex items-center gap-2">
              <i className="ri-shield-check-line text-[14px]"></i>COA Archive
            </Link>
          </div>
        </section>
      </main>
      
    </div>
  );
}
