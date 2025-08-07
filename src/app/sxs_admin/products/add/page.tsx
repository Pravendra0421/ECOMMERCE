import CreateProductForm from "../(_component)/CreateProductForm";
import { ScrollArea } from "@/components/ui/scroll-area";
export default function AddProduct() {
  return (
    <ScrollArea className="h-[90vh] w-full rounded-md">
      <CreateProductForm />
    </ScrollArea>
  );
}
