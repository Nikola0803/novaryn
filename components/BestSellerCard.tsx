"use client";

import { useState } from "react";
import Link from "next/link";
import { getProduct, getVariants, getVariantLabel } from "@/data/products";
import { useCart } from "@/lib/cart-context";

export default function BestSellerCard({
  slug,
  image,
  coaHref,
  batchLabel,
  category,
}: {
  slug: string;
  image: string;
  coaHref: string;
  batchLabel: string;
  category: string;
}) {
  const base = getProduct(slug);
  if (!base) return null;

  const variants = getVariants(base.name);
  const [selectedSlug, setSelectedSlug] = useState(slug);
  const selected = variants.find((v) => v.slug === selectedSlug) ?? base;
  const { addItem } = useCart();

  return (
    <article className="group relative rounded-lg overflow-hidden bg-background-100 border border-background-200/60 hover:border-primary-500/50 transition-all duration-500 ease-precision cursor-pointer">
      <div className="relative aspect-[4/5] overflow-hidden bg-background-900">
        <img
          alt={`${base.name} research peptide vial ${selected.spec}`}
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-precision"
          src={image}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background-100 via-transparent to-transparent opacity-70"></div>
        <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-background-900/80 backdrop-blur border border-primary-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary-500 shadow-[0_0_6px_1px_rgb(var(--secondary-500) / 0.7)]"></span>
          <span className="font-mono text-[10px] tracking-wider text-primary-500">{selected.purity}</span>
        </div>
        <Link
          href={coaHref}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-md bg-background-900/70 backdrop-blur border border-background-200 text-foreground-300 hover:bg-primary-500 hover:text-background-900 hover:border-primary-500 transition-all cursor-pointer"
          title="View COA"
        >
          <i className="ri-shield-check-line text-[15px]"></i>
        </Link>
        <span className="absolute bottom-4 left-4 font-mono text-[10px] tracking-[0.2em] text-foreground-400 uppercase">
          {category}
        </span>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-display text-[19px] text-foreground-100 group-hover:text-primary-500 transition-colors">
            {base.name}
          </h3>
          <span className="font-display text-[17px] text-foreground-100">
            {Number.isInteger(selected.price) ? `$${selected.price}` : `$${selected.price.toFixed(2)}`}
          </span>
        </div>

        {variants.length > 1 ? (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {variants.map((v) => (
              <button
                key={v.slug}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedSlug(v.slug);
                }}
                className={`px-2.5 py-1 rounded-md font-mono text-[10px] tracking-wide border transition-all duration-300 ease-precision cursor-pointer ${
                  v.slug === selected.slug
                    ? "bg-primary-500 text-background-900 border-primary-500"
                    : "bg-background-200/40 text-foreground-400 border-background-200 hover:border-primary-500/50 hover:text-primary-500"
                }`}
              >
                {getVariantLabel(v)}
              </button>
            ))}
          </div>
        ) : (
          <p className="font-mono text-[11px] text-foreground-500 mb-4">{selected.spec}</p>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-background-200/60">
          <div className="flex flex-col">
            <span className="font-mono text-[9px] tracking-[0.2em] text-foreground-600 uppercase">Dose</span>
            <span className="text-[12px] text-foreground-200">{selected.spec}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="font-mono text-[9px] tracking-[0.2em] text-foreground-600 uppercase">Batch</span>
            <span className="font-mono text-[11px] text-primary-500">{batchLabel}</span>
          </div>
        </div>
        <button
          onClick={() =>
            addItem({
              slug: selected.slug,
              name: base.name,
              spec: selected.spec,
              price: selected.price,
              image,
            })
          }
          className="mt-4 w-full h-10 rounded-md bg-background-200 text-foreground-100 text-[12px] font-medium hover:bg-primary-500 hover:text-background-900 transition-all duration-500 ease-precision flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
        >
          <i className="ri-shopping-bag-3-line text-[13px]"></i>Quick Add
        </button>
      </div>
    </article>
  );
}
