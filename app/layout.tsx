import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "remixicon/fonts/remixicon.css";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import CartDrawer from "@/components/CartDrawer";
import SiteFooter from "@/components/SiteFooter";
import VertalisGate from "@/components/VertalisGate";
import QuizPopup from "@/components/QuizPopup";
import WhatsAppButton from "@/components/WhatsAppButton";
import RecentPurchaseToast from "@/components/RecentPurchaseToast";
import AffiliateTracker from "@/components/AffiliateTracker";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const SITE_URL = "https://vertalispeptides.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "VERTALIS · Research Peptides",
    template: "%s · VERTALIS",
  },
  description:
    "Vertalis Peptides is a dedicated supplier of high-purity research peptides and biochemicals for laboratory use. Every product undergoes rigorous third-party analytical verification, with public, batch-searchable Certificates of Analysis.",
  keywords: [
    "research peptides",
    "buy research peptides",
    "peptide COA",
    "third-party tested peptides",
    "BPC-157",
    "Semaglutide research",
    "Tirzepatide research",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "VERTALIS",
    title: "VERTALIS · Research Peptides",
    description:
      "High-purity research peptides, independently tested by third-party labs. Every batch ships with a public, searchable Certificate of Analysis.",
    images: [
      {
        url: "/images/vertalis-cta-bg-01.jpg",
        width: 1200,
        height: 630,
        alt: "VERTALIS Research Peptides",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VERTALIS · Research Peptides",
    description:
      "High-purity research peptides, independently tested by third-party labs. Every batch ships with a public, searchable Certificate of Analysis.",
    images: ["/images/vertalis-cta-bg-01.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    "command-center-verification": "cmrykd31e0005f9o4812q7tzt",
  },
};

const ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Vertalis Peptides",
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.ico`,
  sameAs: [],
};

const WEBSITE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "VERTALIS",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/shop?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-background-800 text-foreground-100 font-sans antialiased">
        {/* Sitewide structured data — Organization + WebSite/SearchAction.
            Per-page schemas (Product, BreadcrumbList) are added on their
            own pages; this is the shared baseline read on every route. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSON_LD) }}
        />
        {/* Runs before hydration so the saved theme applies before first
            paint — avoids a flash of the wrong (default dark) theme on
            load. See components/ThemeToggle.tsx for the toggle itself. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('vertalis-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();",
          }}
        />
        {/* peptidesCRM tracking pixel — injected into <head> via
            strategy="beforeInteractive" since data-key must load before
            other scripts fire. Served over plain HTTP from the Hostinger
            VPS IP; see note below if this gets blocked in production. */}
        <Script
          src="http://72.62.97.74/pixel.js"
          data-key="cmrxfy3wt003035mkz920uby5"
          strategy="beforeInteractive"
        />
        <CartProvider>
          <VertalisGate>
            {children}
            <SiteFooter />
            <CartDrawer />
            <QuizPopup />
            <WhatsAppButton />
            <RecentPurchaseToast />
            <AffiliateTracker />
          </VertalisGate>
        </CartProvider>
      </body>
    </html>
  );
}
