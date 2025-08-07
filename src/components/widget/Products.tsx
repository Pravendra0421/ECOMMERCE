"use client";
import React from "react";
import { ProductEntity } from "@/core/entities/product.entity";
import { CategoryEntity } from "@/core/entities/category.entity";
import Link from "next/link";
import { Button } from "../ui/button";
import { slugifyProduct } from "@/lib/utils/slugify";
interface Props {
  products: ProductEntity[];
  categories: CategoryEntity[];
}

const Products = ({ products, categories }: Props) => {
  return (
    <div className="px-4 py-8 text-center">
      {/* Simple product grid without filters for home page */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        {products.map((product) => {
          const variation = product.variations?.[0];
          const price = variation?.price ?? 0;
          const salePrice = variation?.salePrice ?? 0;
          const hasSale = salePrice > 0 && salePrice < price;

          // Get best media for product
          let mediaUrl =
            "https://placehold.co/400x600/e0e0e0/ffffff?text=No+Image";
          if (product.thumbnailVideo) {
            mediaUrl = product.thumbnailVideo;
          } else if (variation?.images?.length > 0) {
            mediaUrl = variation.images[0].url;
          } else if (product.galleryImages?.length > 0) {
            mediaUrl = product.galleryImages[0].url;
          }

          return (
            <Link
              key={product.id}
              href={`/products/${slugifyProduct(product)}`}
              className="block group relative bg-white rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="relative w-full h-80 bg-gray-100 flex items-center justify-center overflow-hidden">
                {product.thumbnailVideo ? (
                  <video
                    src={mediaUrl}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    muted
                    loop
                    playsInline
                    onMouseEnter={(e) => {
                      const video = e.currentTarget as HTMLVideoElement;
                      video.play().catch(() => {});
                    }}
                    onMouseLeave={(e) => {
                      const video = e.currentTarget as HTMLVideoElement;
                      video.pause();
                      video.currentTime = 0;
                    }}
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}

                {hasSale && (
                  <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded z-10 shadow">
                    SALE
                  </span>
                )}
              </div>

              <div className="p-4 bg-white">
                <p className="text-sm text-gray-500 mb-1">Anouk</p>
                <h3 className="text-base font-semibold text-gray-800 line-clamp-2">
                  {product.name}
                </h3>
                <div className="flex items-baseline mt-2 gap-2">
                  {hasSale ? (
                    <>
                      <span className="text-lg font-bold text-red-600">
                        Rs. {salePrice.toFixed(0)}
                      </span>
                      <span className="text-sm text-gray-500 line-through">
                        Rs. {price.toFixed(0)}
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-bold text-gray-900">
                      Rs. {price.toFixed(0)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <Link href={"/products"}>
        <Button className="rounded-none mt-2">view All</Button>
      </Link>
    </div>
  );
};

export default Products;
