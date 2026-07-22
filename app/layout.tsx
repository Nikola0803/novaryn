import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "remixicon/fonts/remixicon.css";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import CartDrawer from "@/components/CartDrawer";
import SiteFooter from "@/components/SiteFooter";
import VertalisGate from "@/components/VertalisGate";
import QuizPopup from "@/components/QuizPopup";
import WhatsAppButton from "@/components/WhatsAppButton";
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

export const metadata: Metadata = {
  title: "VERTALIS · Research Peptides",
  description:
    "Vertalis Labs is a dedicated supplier of high-purity research peptides and biochemicals for laboratory use. Every product undergoes rigorous third-party analytical verification.",
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
        {/* Runs before hydration so the saved theme applies before first
            paint — avoids a flash of the wrong (default dark) theme on
            load. See components/ThemeToggle.tsx for the toggle itself. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('vertalis-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();",
          }}
        />
        <CartProvider>
          <VertalisGate>
            {children}
            <SiteFooter />
            <CartDrawer />
            <QuizPopup />
            <WhatsAppButton />
            <AffiliateTracker />
          </VertalisGate>
        </CartProvider>
      </body>
    </html>
  );
}
