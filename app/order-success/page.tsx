import Header from "@/components/Header";
import PromoBanner from "@/components/PromoBanner";
import Footer from "@/components/Footer";

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen bg-background-800 text-foreground-100"><PromoBanner /><Header /><main className="pt-[112px]"><section className="w-full max-w-[640px] mx-auto px-6 py-20 flex flex-col items-center text-center"><div className="w-20 h-20 flex items-center justify-center rounded-full bg-secondary-500/10 border border-secondary-500/30 mb-6"><i className="ri-check-line text-[32px] text-secondary-500"></i></div><h2 className="font-display text-[28px] text-foreground-100 mb-3">Order Submitted</h2><p className="text-[14px] text-foreground-500 max-w-md mb-4">Your order has been received. Please complete payment via <strong className="text-foreground-200">Zelle</strong> to <span className="font-mono text-primary-500">orders@vertalispeptides.com</span> and include your custom code in the payment notes for faster verification.</p><p className="text-[12px] text-foreground-600 mb-8">Orders are typically dispatched within 24 hours of payment confirmation.</p><button className="h-11 px-6 rounded-md bg-primary-500 text-background-900 text-[13px] font-semibold hover:bg-primary-400 transition-all cursor-pointer whitespace-nowrap">Back to Catalog</button></section></main></div>
  );
}
