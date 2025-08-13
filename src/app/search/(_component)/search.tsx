'use client'
import { ProductEntity } from '@/core/entities/product.entity';
import React from 'react'
import { ProductFilters } from '@/components/ui/product-filters';
import { slugifyProduct } from "@/lib/utils/slugify";
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
type ChildProps ={
  products:ProductEntity[];
  
}
const getAvailableSizes = (product: ProductEntity): string => {
  if (!product.variations?.length) return "N/A";
  const sizes = Array.from(new Set(product.variations.map((v) => v.size)));
  return sizes.join(", ");
};

const getDiscountPercent = (price: number, salePrice: number) =>
  Math.max(0, Math.round(((price - salePrice) / price) * 100));

const getBestMedia = (product: ProductEntity) => {
  const variation = product.variations?.[0];

  if (product.thumbnailVideo) {
    return {
      type: "video" as const,
      url: product.thumbnailVideo,
      alt: product.name,
    };
  }

  if (variation?.images?.length > 0) {
    return {
      type: "image" as const,
      url: variation.images[0].url,
      alt: product.name,
    };
  }

  if (product.galleryImages?.length > 0) {
    return {
      type: "image" as const,
      url: product.galleryImages[0].url,
      alt: product.name,
    };
  }

  return {
    type: "image" as const,
    url: "https://placehold.co/400x600/e0e0e0/ffffff?text=No+Image",
    alt: product.name,
  };
};

const SearchProduct = ({products}:ChildProps) => {
    const [filteredProducts, setFilteredProducts] =
      useState<ProductEntity[]>(products);
  if (!products?.length) {
    return (
      <div className="text-center py-8 text-gray-500 text-lg">
        No products available to display in this category.
      </div>
    );
  }
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="lg:w-64 lg:flex-shrink-0">
          {/* <ProductFilters
            products={products}
            onFiltersChange={setFilteredProducts}
          /> */}
        </div>
        {/* Products Section */}
        <div className="flex-1">
          {/* Results count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-600">
              Showing {filteredProducts.length} of {products.length} products
            </p>
          </div>

          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
                const variation = product.variations?.[0];
                const media = getBestMedia(product);

                const price = variation?.price ?? 0;
                const salePrice = variation?.salePrice ?? 0;
                const hasSale = salePrice > 0 && salePrice < price;
                const discount = hasSale
                  ? getDiscountPercent(price, salePrice)
                  : 0;

                const availableSizes = getAvailableSizes(product);

                return (
                  <Link
                    key={product.id}
                    href={`/products/${slugifyProduct(product)}`}
                    className="block group relative bg-white rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="relative w-full h-80 bg-gray-100 flex items-center justify-center overflow-hidden">
                      {media.type === "video" ? (
                        <video
                          src={media.url}
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
                        <Image
                          src={media.url}
                          alt={media.alt}
                          fill
                          style={{ objectFit: "cover" }}
                          sizes="(max-width:640px)100vw,(max-width:768px)50vw,(max-width:1024px)33vw,25vw"
                          className="transition-transform duration-300 group-hover:scale-105"
                        />
                      )}

                      {media.type === "video" && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                          <div className="bg-black/50 rounded-full p-2">
                            <svg
                              className="w-6 h-6 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md text-gray-700 hover:text-red-500 hover:scale-110 transition-transform duration-200 z-10"
                        aria-label="Add to wishlist"
                        onClick={(e) => {
                          e.preventDefault();
                          alert("Wishlist functionality coming soon!");
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>

                      {hasSale && (
                        <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded z-10 shadow">
                          {discount}% OFF
                        </span>
                      )}
                    </div>

                    <div className="p-4 bg-white">
                      <p className="text-sm text-gray-500 mb-1">Anouk</p>
                      <h3 className="text-base font-semibold text-gray-800 line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-600 mt-2">
                        Sizes: {availableSizes}
                      </p>
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
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No products match your filters.
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Try adjusting your filter criteria.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchProduct;