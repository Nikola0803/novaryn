"use client";

import Link from "next/link";
import Image from "next/image";
import { Product } from "@/data/products";
import { useCart } from "@/lib/cart-context";

function formatPrice(price: number) {
  return Number.isInteger(price) ? `$${price}` : `$${price.toFixed(2)}`;
}

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const href = `/product/${product.slug}`;

  return (
    <article
      className="group relative rounded-xl overflow-hidden bg-background-900/70 border border-background-200/60 hover:border-primary-500/40 transition-all duration-500 ease-precision cursor-pointer"
      data-product-shop="true"
    >
      <Link href={href} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-background-100">
          <Image
            src={product.image}
            alt={product.imgAlt}
            title={product.imgTitle}
            fill
            className="object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-precision"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background-900/90 via-background-900/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500"></div>
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background-900/70 backdrop-blur border border-background-200/50">
            <span className={`w-1.5 h-1.5 rounded-full ${product.statusDot}`}></span>
            <span className="font-mono text-[10px] tracking-wider text-foreground-300">
              {product.statusLabel}
            </span>
          </div>
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background-900/70 backdrop-blur border border-primary-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary-500 shadow-[0_0_7px_2px_rgba(94,232,160,0.6)]"></span>
            <span className="font-mono text-[10px] tracking-wider text-primary-500">
              {product.purity}
            </span>
          </div>
        </div>
      </Link>
      <div className="p-4">
        <span className="inline-block px-2 py-0.5 mb-2 rounded-md bg-background-100 font-mono text-[10px] tracking-wider text-foreground-500 uppercase">
          {product.category}
        </span>
        <Link href={href} className="block">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="font-display text-[16px] leading-tight text-foreground-100 group-hover:text-primary-500 transition-colors duration-500">
              {product.name}
            </h3>
            <div className="flex items-baseline gap-1 whitespace-nowrap">
              <span className="font-display text-[16px] text-foreground-100 group-hover:text-foreground-100 transition-colors duration-500">
                {formatPrice(product.price)}
              </span>
              <span className="font-mono text-[10px] text-foreground-600">USD</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mb-4">
            <i className="ri-shield-check-line text-[12px] text-secondary-500"></i>
            <span className="font-mono text-[11px] tracking-wide text-secondary-500">
              99%+ Purity Verified
            </span>
          </div>
        </Link>
        <button
          disabled={product.disabled}
          onClick={() =>
            addItem({
              slug: product.slug,
              name: product.name,
              spec: product.spec,
              price: product.price,
              image: product.image,
            })
          }
          className="w-full h-10 rounded-lg text-[12px] font-medium transition-all duration-500 ease-precision flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer bg-background-100 text-foreground-300 hover:bg-primary-500 hover:text-background-900 hover:shadow-[0_0_20px_-4px_rgba(94,232,213,0.4)] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-background-100 disabled:hover:text-foreground-300 disabled:hover:shadow-none"
        >
          <i className="ri-shopping-bag-3-line text-[13px]"></i>
          {product.buttonText}
        </button>
        {product.footText && (
          <p className={product.footClass ?? ""}>{product.footText}</p>
        )}
      </div>
    </article>
  );
}
