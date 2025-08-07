import React from "react";
import { getProductByIdUSeCase } from "@/core/usecases/GetProductById.usecase";
import { ProductApiRepository } from "@/infrastructure/frontend/repositories/ProductRepository.api";
import SingleProductCard from "../(components)/SingleProductCard";

export default async function ProductPage(props: any) {
  const { params } = props as { params: { slug: string } };
  const slug = params.slug;
  if (!slug) {
    throw new Error("Missing product slug in route params");
  }
  const productId = slug.split("-").pop();
  if (!productId) {
    throw new Error("Invalid product slug: missing ID");
  }

  const productRepository = new ProductApiRepository();
  const getProductUseCase = new getProductByIdUSeCase(productRepository);

  let product = null;
  let error = null;

  try {
    product = await getProductUseCase.execute(productId);
  } catch (err) {
    console.error("Error fetching product:", err);
    error = "Failed to load product. Please try again later.";
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <p className="text-red-600 text-lg">{error}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <p className="text-gray-700 text-lg">Product not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <SingleProductCard product={product} />
    </div>
  );
}
