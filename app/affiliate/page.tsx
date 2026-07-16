import Link from "next/link";
import Header from "@/components/Header";

const BENEFITS = [
  { icon: "ri-percent-line", title: "Commission on Every Order", body: "Earn a percentage on every verified order placed through your unique referral link. Commission structure scales with volume." },
  { icon: "ri-dashboard-line", title: "Affiliate Dashboard", body: "Track clicks, conversions, and earnings in real time through your dedicated affiliate portal." },
  { icon: "ri-gift-line", title: "Personal Discount", body: "Affiliates receive a personal discount code for their own research procurement in addition to commission earnings." },
  { icon: "ri-time-line", title: "60-Day Cookie Window", body: "Referral attribution is tracked for 60 days from the initial click — not just the first session." },
  { icon: "ri-secure-payment-line", title: "Monthly Payouts", body: "Earnings are paid out monthly via Zelle, Venmo, or Cash App with no minimum threshold." },
  { icon: "ri-community-line", title: "Priority Support", body: "Lab affiliates get dedicated priority support for their own orders and a direct contact line to the team." },
];

const TIERS = [
  { label: "Researcher", commission: "8%", minVolume: "$0", color: "border-foreground-500/30 text-foreground-400" },
  { label: "Lab Associate", commission: "12%", minVolume: "$2,000/mo referred", color: "border-primary-500/40 text-primary-500" },
  { label: "Principal", commission: "16%", minVolume: "$5,000/mo referred", color: "border-secondary-500/40 text-secondary-500" },
];

export default function AffiliatePage() {
  return (
    <div className="min-h-screen bg-background-800 text-foreground-100">
      <Header />
      <main>
        {/* Hero */}
        <section className="relative pt-[72px] bg-background-900 border-b border-background-200/60 overflow-hidden">
          <div className="absolute inset-0 grid-overlay opacity-20 pointer-events-none"></div>
          <div className="absolute top-20 right-10 w-96 h-96 rounded-full bg-primary-500/6 blur-[140px] pointer-events-none"></div>
          <div className="relative w-full max-w-[1440px] mx-auto px-6 md:px-10 py-20 md:py-28">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-px bg-primary-500/60"></span>
              <span className="font-mono text-[10px] tracking-[0.28em] text-primary-500 uppercase">Lab Affiliate Program</span>
            </div>
            <h1 className="font-display text-[44px] md:text-[64px] leading-[0.95] tracking-tightest text-foreground-100 mb-6 max-w-3xl">
              Refer colleagues.<br /><span className="text-platinum">Earn on every order.</span>
            </h1>
            <p className="text-[16px] text-foreground-400 max-w-xl leading-relaxed mb-10">
              Designed for researchers, lab managers, and institutions who trust Novaryn and want to extend that trust — and earn while doing it.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="#apply" className="h-12 px-8 rounded-md bg-primary-500 text-background-900 text-[13px] font-semibold hover:bg-primary-400 transition-all cursor-pointer inline-flex items-center gap-2">
                <i className="ri-user-add-line text-[14px]"></i>Apply Now
              </a>
              <a href="#tiers" className="h-12 px-8 rounded-md border border-background-200 text-[13px] text-foreground-300 hover:border-primary-500 hover:text-primary-500 transition-all cursor-pointer inline-flex items-center gap-2">
                View Commission Tiers
              </a>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-24 md:py-32">
          <div className="w-full max-w-[1440px] mx-auto px-6 md:px-10">
            <div className="max-w-3xl mb-16">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-[10px] tracking-[0.28em] text-primary-500 uppercase">/ 01 · How It Works</span>
                <span className="w-8 h-px bg-primary-500/40"></span>
              </div>
              <h2 className="font-display text-[38px] md:text-[48px] leading-[1.02] tracking-tightest text-foreground-100">
                Simple by design.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { n: "01", icon: "ri-user-add-line", title: "Apply", body: "Submit your affiliate application. We review eligibility within 48 hours and provide access to your dashboard and unique referral link." },
                { n: "02", icon: "ri-share-line", title: "Refer", body: "Share your link with colleagues, institutions, or in research communities. Every click is tracked for 60 days." },
                { n: "03", icon: "ri-money-dollar-circle-line", title: "Earn", body: "Earn commission on every confirmed order from your referrals. Paid monthly, no minimum threshold." },
              ].map((step) => (
                <div key={step.n} className="group relative p-8 rounded-xl bg-background-900/70 border border-background-200/60 hover:border-primary-500/30 transition-all duration-500">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-primary-500 mb-4 block">{step.n}</span>
                  <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-primary-500/10 text-primary-500 mb-5 group-hover:bg-primary-500 group-hover:text-background-900 transition-all duration-500">
                    <i className={`${step.icon} text-[20px]`}></i>
                  </div>
                  <h3 className="font-display text-[20px] text-foreground-100 mb-2">{step.title}</h3>
                  <p className="text-[13px] text-foreground-500 leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="border-t border-background-200/60 bg-background-900/40 py-24 md:py-32">
          <div className="w-full max-w-[1440px] mx-auto px-6 md:px-10">
            <div className="max-w-3xl mb-16">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-[10px] tracking-[0.28em] text-primary-500 uppercase">/ 02 · Program Benefits</span>
                <span className="w-8 h-px bg-primary-500/40"></span>
              </div>
              <h2 className="font-display text-[38px] md:text-[48px] leading-[1.02] tracking-tightest text-foreground-100">
                What you get.
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {BENEFITS.map((b) => (
                <div key={b.title} className="group relative rounded-xl bg-background-900/70 border border-background-200/60 p-6 hover:border-primary-500/25 transition-all duration-500">
                  <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary-500/10 text-primary-500 mb-4 group-hover:bg-primary-500/20 transition-colors">
                    <i className={`${b.icon} text-[18px]`}></i>
                  </div>
                  <h4 className="font-display text-[15px] text-foreground-100 mb-2">{b.title}</h4>
                  <p className="text-[13px] text-foreground-500 leading-relaxed">{b.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Commission tiers */}
        <section id="tiers" className="border-t border-background-200/60 py-24 md:py-32">
          <div className="w-full max-w-[1440px] mx-auto px-6 md:px-10">
            <div className="max-w-3xl mb-16">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-[10px] tracking-[0.28em] text-primary-500 uppercase">/ 03 · Commission Tiers</span>
                <span className="w-8 h-px bg-primary-500/40"></span>
              </div>
              <h2 className="font-display text-[38px] md:text-[48px] leading-[1.02] tracking-tightest text-foreground-100">
                Scales with your network.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {TIERS.map((tier) => (
                <div key={tier.label} className={`relative rounded-xl bg-background-900/70 border p-8 ${tier.color}`}>
                  <p className="font-mono text-[10px] tracking-[0.2em] uppercase mb-3">{tier.label}</p>
                  <p className="font-display text-[52px] leading-none mb-1">{tier.commission}</p>
                  <p className="font-mono text-[11px] opacity-60 mb-6">commission per order</p>
                  <div className="pt-5 border-t border-background-200/40">
                    <p className="font-mono text-[10px] tracking-[0.18em] text-foreground-600 uppercase mb-1">Monthly Referrals Required</p>
                    <p className="text-[13px] text-foreground-300">{tier.minVolume}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Application */}
        <section id="apply" className="border-t border-background-200/60 bg-background-900/50 py-24 md:py-32">
          <div className="w-full max-w-[640px] mx-auto px-6 md:px-10">
            <div className="text-center mb-12">
              <h2 className="font-display text-[38px] md:text-[48px] leading-[1.02] tracking-tightest text-foreground-100 mb-3">
                Apply to the program.
              </h2>
              <p className="text-[14px] text-foreground-500">Applications are reviewed within 48 hours. We accept researchers, lab managers, and institutional buyers.</p>
            </div>
            <form className="space-y-5 rounded-xl bg-background-900/70 border border-background-200/60 p-8">
              {[
                ["Full Name", "text", "Dr. Jane Smith"],
                ["Email", "email", "you@institution.edu"],
                ["Institution / Lab", "text", "Harvard Medical School — Biochemistry"],
                ["Website or Profile URL", "url", "https://lab.university.edu/yourprofile"],
              ].map(([label, type, ph]) => (
                <div key={String(label)}>
                  <label className="block text-[12px] font-medium text-foreground-300 mb-1.5">{label}</label>
                  <input type={String(type)} placeholder={String(ph)} className="w-full h-10 px-3 rounded-md bg-background-100 border border-background-200 text-foreground-100 text-sm placeholder:text-foreground-600 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/40 transition" />
                </div>
              ))}
              <div>
                <label className="block text-[12px] font-medium text-foreground-300 mb-1.5">How do you plan to promote Novaryn?</label>
                <textarea rows={4} placeholder="Describe your network, platform, or community…" className="w-full px-3 py-3 rounded-md bg-background-100 border border-background-200 text-foreground-100 text-sm placeholder:text-foreground-600 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/40 transition resize-none"></textarea>
              </div>
              <button type="submit" className="w-full h-11 rounded-md bg-primary-500 text-background-900 text-[13px] font-semibold hover:bg-primary-400 transition-all cursor-pointer flex items-center justify-center gap-2">
                <i className="ri-send-plane-line text-[14px]"></i>Submit Application
              </button>
            </form>
          </div>
        </section>
      </main>
      
    </div>
  );
}
