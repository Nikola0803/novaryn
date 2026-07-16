import ProductPageClient from "@/components/ProductPageClient";
import { PRODUCTS } from "@/data/products";

export function generateStaticParams() {
  return PRODUCTS.filter((p) => !p.hidden).map((p) => ({ slug: p.slug }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ProductPageClient slug={slug} />;
}
