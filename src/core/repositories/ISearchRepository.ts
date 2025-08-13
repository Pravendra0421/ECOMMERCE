import prisma from "@/lib/prisma";
import { SearchProductDto } from "../dtos/Search.dto";
import { ProductEntity } from "../entities/product.entity";

export interface ISearchRepository{
    search(filter:SearchProductDto):Promise<ProductEntity[]>;
}
export class SearchRepository implements ISearchRepository{
    async search(filter: SearchProductDto): Promise<ProductEntity[]> {
        const Search = await prisma.product.findMany({
            where:{
                AND:[
                    filter.query?{
                        OR:[
                            {name:{contains:filter.query,mode:'insensitive'}},

                        ]
                    }:{},
                    filter.categoryId
                    ?{categoryIds:{has:filter.categoryId}}:{},
                    filter.minPrice || filter.maxPrice
                    ?{
                        variations:{
                            some:{
                                price:{
                                    gte:filter.minPrice ?? undefined,
                                    lte:filter.maxPrice ?? undefined
                                }
                            }
                        }
                    }:{},
                    filter.color
                    ?{variations:{some:{color:{equals:filter.color,mode:'insensitive'}}}}
                    :{},
                    filter.color
                    ?{variations:{some:{size:{equals:filter.size,mode:'insensitive'}}}}
                    :{},
                ]
            },
            include:{
                variations:true,
                categories:true
            }
        });
        return Search as unknown as ProductEntity[];
    }
}