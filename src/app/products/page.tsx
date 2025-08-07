import { ProductList } from "./(components)/ProductList";
import ProductGridDisplay from "../category/(component)/productGripDisplay";
import { GetAllProductsUseCase } from "@/core/usecases/GetAllProducts.usecase";
import { ProductRepository } from "@/core/repositories/IProductRepository";
import { GetAllCategoriesUseCase } from "@/core/usecases/GetAllCategory.usecase";
import { CategoryRepository } from "@/core/repositories/ICategoryRepository";

// The Page component is now async
export default async function ProductsPage() {
  const productRepository = new ProductRepository();
  const categoryRepository = new CategoryRepository();

  const getAllProducts = new GetAllProductsUseCase(productRepository);
  const getAllCategories = new GetAllCategoriesUseCase(categoryRepository);

  // Fetch the data on the server before rendering the page.
  const [products, categories] = await Promise.all([
    getAllProducts.execute(),
    getAllCategories.execute(),
  ]);

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-4xl font-extrabold mb-8"></h1>
      <ProductGridDisplay products={products} categories={categories} />
    </main>
  );
}
