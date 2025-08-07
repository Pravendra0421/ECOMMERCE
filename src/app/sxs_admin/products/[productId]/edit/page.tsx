import { ProductRepository } from "@/core/repositories/IProductRepository";
import { getProductByIdUSeCase } from "@/core/usecases/GetProductById.usecase";
import { notFound } from "next/navigation";
import UpdateProductForm from "../../(_component)/updatedProductForm";
import { ScrollArea } from "@/components/ui/scroll-area";
export default async function ProductEditPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const productIdTouse = productId;
  const productRepository = new ProductRepository();
  const getProductbyIdusecase = new getProductByIdUSeCase(productRepository);
  let initialProduct;
  try {
    initialProduct = await getProductbyIdusecase.execute(productIdTouse);
  } catch (error) {
    console.error(
      `Error fetching product with ID ${productIdTouse} for edit:`,
      error
    );
  }
  if (!initialProduct) {
    notFound();
  }
  return (
    <>
      <h1 className="text-2xl text-black font-bold ">
        Edit Product: {initialProduct.name}
      </h1>
      <ScrollArea className="h-[90vh] w-full rounded-md">
        <UpdateProductForm productId={productIdTouse} />
      </ScrollArea>
    </>
  );
}
