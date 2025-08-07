"use client";

import React, { useState, useEffect } from "react";
import { Checkbox } from "./checkbox";
import { Slider } from "./slider";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { ProductEntity } from "@/core/entities/product.entity";
import { CategoryEntity } from "@/core/entities/category.entity";

interface ProductFiltersProps {
  products: ProductEntity[];
  categories: CategoryEntity[];
  onFiltersChange: (filteredProducts: ProductEntity[]) => void;
  className?: string;
}

interface FilterState {
  priceRange: [number, number];
  selectedSizes: string[];
  selectedCategories: string[];
}

export function ProductFilters({
  products,
  categories,
  onFiltersChange,
  className,
}: ProductFiltersProps) {
  // Calculate price range from products
  const allPrices = products.flatMap(
    (product) => product.variations?.map((v) => v.price) || []
  );
  const minPrice = Math.min(...allPrices, 0);
  const maxPrice = Math.max(...allPrices, 10000);

  // Get all available sizes
  const allSizes = Array.from(
    new Set(
      products.flatMap(
        (product) => product.variations?.map((v) => v.size) || []
      )
    )
  ).sort();

  const [filters, setFilters] = useState<FilterState>({
    priceRange: [minPrice, maxPrice],
    selectedSizes: [],
    selectedCategories: [],
  });

  const [isOpen, setIsOpen] = useState(false);

  // Apply filters whenever filters state changes
  useEffect(() => {
    const filteredProducts = products.filter((product) => {
      // Price filter
      const productPrices = product.variations?.map((v) => v.price) || [];
      const hasValidPrice = productPrices.some(
        (price) =>
          price >= filters.priceRange[0] && price <= filters.priceRange[1]
      );
      if (!hasValidPrice) return false;

      // Size filter
      if (filters.selectedSizes.length > 0) {
        const productSizes = product.variations?.map((v) => v.size) || [];
        const hasSelectedSize = productSizes.some((size) =>
          filters.selectedSizes.includes(size)
        );
        if (!hasSelectedSize) return false;
      }

      // Category filter
      if (filters.selectedCategories.length > 0) {
        const productCategoryIds = product.categories?.map((c) => c.id) || [];
        const hasSelectedCategory = productCategoryIds.some((categoryId) =>
          filters.selectedCategories.includes(categoryId)
        );
        if (!hasSelectedCategory) return false;
      }

      return true;
    });

    onFiltersChange(filteredProducts);
  }, [filters, products, onFiltersChange]);

  const handlePriceChange = (value: number[]) => {
    setFilters((prev) => ({
      ...prev,
      priceRange: [value[0], value[1]],
    }));
  };

  const handleSizeChange = (size: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      selectedSizes: checked
        ? [...prev.selectedSizes, size]
        : prev.selectedSizes.filter((s) => s !== size),
    }));
  };

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      selectedCategories: checked
        ? [...prev.selectedCategories, categoryId]
        : prev.selectedCategories.filter((id) => id !== categoryId),
    }));
  };

  const clearFilters = () => {
    setFilters({
      priceRange: [minPrice, maxPrice],
      selectedSizes: [],
      selectedCategories: [],
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (
      filters.priceRange[0] !== minPrice ||
      filters.priceRange[1] !== maxPrice
    )
      count++;
    if (filters.selectedSizes.length > 0) count++;
    if (filters.selectedCategories.length > 0) count++;
    return count;
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant="outline"
          className="w-full flex items-center justify-between"
        >
          <span>Filters</span>
          <div className="flex items-center gap-2">
            {getActiveFiltersCount() > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                {getActiveFiltersCount()}
              </span>
            )}
            <svg
              className={cn(
                "w-4 h-4 transition-transform",
                isOpen && "rotate-180"
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </Button>
      </div>

      {/* Filter Panel */}
      <div
        className={cn(
          "bg-white border rounded-lg p-6 space-y-6",
          "lg:block",
          isOpen ? "block" : "hidden"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Filters</h3>
          {getActiveFiltersCount() > 0 && (
            <Button
              onClick={clearFilters}
              variant="ghost"
              size="sm"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Price Range Filter */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Price Range</h4>
          <div className="space-y-4">
            <Slider
              value={filters.priceRange}
              onValueChange={handlePriceChange}
              min={minPrice}
              max={maxPrice}
              step={100}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span>₹{filters.priceRange[0].toLocaleString()}</span>
              <span>₹{filters.priceRange[1].toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Size Filter */}
        {allSizes.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Size</h4>
            <div className="space-y-3">
              {allSizes.map((size) => (
                <div key={size} className="flex items-center space-x-2">
                  <Checkbox
                    id={`size-${size}`}
                    checked={filters.selectedSizes.includes(size)}
                    onCheckedChange={(checked) =>
                      handleSizeChange(size, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={`size-${size}`}
                    className="text-sm text-gray-700 cursor-pointer"
                  >
                    {size}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Category</h4>
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={filters.selectedCategories.includes(category.id)}
                    onCheckedChange={(checked) =>
                      handleCategoryChange(category.id, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={`category-${category.id}`}
                    className="text-sm text-gray-700 cursor-pointer"
                  >
                    {category.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {getActiveFiltersCount() > 0 && (
          <div className="pt-4 border-t">
            <div className="flex flex-wrap gap-2">
              {filters.selectedSizes.map((size) => (
                <span
                  key={size}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  Size: {size}
                  <button
                    onClick={() => handleSizeChange(size, false)}
                    className="ml-1 hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
              {filters.selectedCategories.map((categoryId) => {
                const category = categories.find((c) => c.id === categoryId);
                return (
                  <span
                    key={categoryId}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    {category?.name}
                    <button
                      onClick={() => handleCategoryChange(categoryId, false)}
                      className="ml-1 hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
