import React from 'react'
import { SearchRepository } from '@/core/repositories/ISearchRepository';
import { SearchUsecase } from '@/core/usecases/Search.usecase';
import { SearchProductDto } from '@/core/dtos/Search.dto';
import SearchProduct from './(_component)/search';

type PageProps = {
    searchParams: Promise<{ query?: string; categoryId?: string; minPrice?: string; maxPrice?: string; color?: string; size?: string }>;
}
const search = new SearchRepository();
const searchusecase = new SearchUsecase(search);
const Page = async({ searchParams }: PageProps) => {
    const sp = await searchParams;
    const filterData:SearchProductDto={
        query: sp.query || undefined,
        categoryId: sp.categoryId || undefined,
        minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
        maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
        color: sp.color || undefined,
        size: sp.size || undefined
    };
    const searchProduct = await searchusecase.Search(filterData);
    console.log(searchProduct);
  return (
    <div>
      <SearchProduct products={searchProduct}/>
    </div>
  )
}

export default Page;