export function slugifyProduct(product: { name: string; id: string }) {
  return (
    product.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-") // replace non-alphanumeric with hyphens
      .replace(/(^-|-$)+/g, "") + // remove leading/trailing hyphens
    "-" +
    product.id
  );
}
export function slugifyCategory(category: { name: string; id: string }) {
  return (
    category.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") + // remove leading/trailing hyphens
    "-" +
    category.id
  );
}
