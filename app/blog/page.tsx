import Link from "next/link";
import Header from "@/components/Header";
import PromoBanner from "@/components/PromoBanner";

const POSTS = [
  {
    tag: "Quality & Verification",
    title: "How to actually read a Certificate of Analysis",
    excerpt:
      "Purity percentage is one line on the page. Here's what the HPLC chromatogram, retention time, and mass spec confirmation are actually telling you, and why we publish every one.",
    date: "Jul 2, 2026",
    readTime: "6 min read",
    icon: "ri-file-chart-line",
  },
  {
    tag: "Storage & Handling",
    title: "Lyophilized vs. cold-chain: what shelf-stability really means",
    excerpt:
      "Freeze-dried peptides ship ambient and store in a standard freezer, no cold-chain courier required. We break down the chemistry behind why lyophilization holds up, and how to store a vial once it arrives.",
    date: "Jun 24, 2026",
    readTime: "5 min read",
    icon: "ri-flask-line",
  },
  {
    tag: "Research Notes",
    title: "GLP-1 and dual-agonist research: a 2026 landscape",
    excerpt:
      "A plain-language overview of where GLP-1, GIP, and glucagon receptor research stands today, and the compounds researchers are requesting most.",
    date: "Jun 11, 2026",
    readTime: "8 min read",
    icon: "ri-line-chart-line",
  },
  {
    tag: "Lab Practices",
    title: "Reconstitution basics: bacteriostatic water, dosing math, and common mistakes",
    excerpt:
      "A practical walkthrough of reconstituting lyophilized powder for research use, including the concentration math researchers ask us about most often.",
    date: "May 28, 2026",
    readTime: "7 min read",
    icon: "ri-test-tube-line",
  },
  {
    tag: "Company",
    title: "Why we publish every COA, even the ones that don't look perfect",
    excerpt:
      "Public archives mean a batch that misses threshold shows up too. Here's why we think that's the only version of \"verified\" worth trusting.",
    date: "May 14, 2026",
    readTime: "4 min read",
    icon: "ri-shield-check-line",
  },
  {
    tag: "Research Notes",
    title: "BPC-157 and TB-500 in tissue-repair research: current literature",
    excerpt:
      "A survey of published research on these two of the most-requested recovery-focused peptides, and what questions the literature still leaves open.",
    date: "Apr 30, 2026",
    readTime: "9 min read",
    icon: "ri-heart-pulse-line",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background-800 text-foreground-100">
      <PromoBanner /><Header />
      <main>
        <section className="relative pt-[112px] bg-background-900 border-b border-background-200/60">
          <div className="absolute inset-0 grid-overlay opacity-20 pointer-events-none"></div>
          <div className="relative w-full max-w-[1440px] mx-auto px-6 md:px-10 py-20 md:py-24">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-px bg-primary-500/60"></span>
              <span className="font-mono text-[10px] tracking-[0.28em] text-primary-500 uppercase">Blog</span>
            </div>
            <h1 className="font-display text-[44px] md:text-[60px] leading-[0.95] tracking-tightest text-foreground-100 mb-4 max-w-2xl">
              Research notes, methodology, and what we&#39;re learning.
            </h1>
            <p className="text-[15px] text-foreground-400 max-w-lg">
              Notes from our lab and QA team on purity verification, storage science, and the research our compounds show up in most.
            </p>
          </div>
        </section>

        <section className="w-full max-w-[1440px] mx-auto px-6 md:px-10 py-16 md:py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {POSTS.map((post) => (
              <article
                key={post.title}
                className="group relative flex flex-col rounded-xl border border-background-200/60 bg-background-900/70 p-6 hover:border-primary-500/40 transition-all duration-500 ease-precision"
              >
                <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary-500/10 text-primary-500 mb-5 group-hover:bg-primary-500 group-hover:text-background-900 transition-all duration-500">
                  <i className={`${post.icon} text-[18px]`}></i>
                </div>
                <span className="font-mono text-[10px] tracking-[0.2em] text-primary-500 uppercase mb-3">{post.tag}</span>
                <h2 className="font-display text-[19px] leading-snug text-foreground-100 mb-3 group-hover:text-primary-500 transition-colors">
                  {post.title}
                </h2>
                <p className="text-[13px] text-foreground-500 leading-relaxed mb-6 flex-1">{post.excerpt}</p>
                <div className="flex items-center justify-between pt-4 border-t border-background-200/40">
                  <span className="font-mono text-[10px] text-foreground-600">{post.date}</span>
                  <span className="font-mono text-[10px] text-foreground-600">{post.readTime}</span>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-14 rounded-xl border border-background-200/60 bg-background-900/50 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-display text-[20px] text-foreground-100 mb-1">New posts published regularly.</h3>
              <p className="text-[13px] text-foreground-500">Subscribe below for research notes and new COA batches as they publish.</p>
            </div>
            <Link
              href="/#newsletter"
              className="shrink-0 h-10 px-6 rounded-md bg-primary-500 text-background-900 text-[13px] font-semibold hover:bg-primary-400 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <i className="ri-mail-line text-[14px]"></i>Subscribe
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
