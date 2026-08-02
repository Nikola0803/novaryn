import type { Metadata } from "next";
import VerifyClient from "@/components/VerifyClient";
import { PRODUCTS, getProduct } from "@/data/products";
import { getLatestCoaForProduct } from "@/data/coa-records";

const SITE_URL = "https://vertalispeptides.com";

export function generateStaticParams() {
  return PRODUCTS.filter((p) => !p.hidden).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Batch Verification" };

  const coa = getLatestCoaForProduct(product.name);
  const title = `Verify ${product.name} · Batch Certificate`;
  const description = coa
    ? `Independent COA for ${product.name}: batch ${coa.batchCode}, ${coa.purity} purity, tested ${coa.testDate}.`
    : `Scan-to-verify batch page for ${product.name}, a Vertalis research peptide.`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/verify/${product.slug}` },
    robots: { index: false, follow: true },
  };
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <VerifyClient slug={slug} />;
}
