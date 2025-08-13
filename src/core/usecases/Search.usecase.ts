import { ISearchRepository } from "../repositories/ISearchRepository";
import { SearchProductDto } from "../dtos/Search.dto";
import { ProductEntity } from "../entities/product.entity";

export class SearchUsecase{
    constructor(private searchRepository:ISearchRepository){}
    async Search(filter:SearchProductDto):Promise<ProductEntity[]>{
        const search = await this.searchRepository.search(filter);
        return search;
    }
}