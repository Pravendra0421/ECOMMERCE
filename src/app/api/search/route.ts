import { SearchRepository } from "@/core/repositories/ISearchRepository";
import { SearchUsecase } from "@/core/usecases/Search.usecase";
import { SearchProductDto } from "@/core/dtos/Search.dto";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request:NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const filterData: SearchProductDto = {
        query: searchParams.get('query') || undefined,
        categoryId: searchParams.get('categoryId') || undefined,
        minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
        maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
        color: searchParams.get('color') || undefined,
        size: searchParams.get('size') || undefined,
        };
        const searchRepository = new SearchRepository();
        const searchUSecase = new SearchUsecase(searchRepository);
        const search = await searchUSecase.Search(filterData);
    return NextResponse.json(search,{status:201});
    }catch (error) {
    console.error("Failed to search:", error);
        if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 400 });
        }
    }
}