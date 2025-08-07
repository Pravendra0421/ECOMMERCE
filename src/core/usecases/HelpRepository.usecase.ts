import { IHelpQueryRepository } from "../repositories/IHelpQueryRepository";
import { CreateHelpQueryDTO } from "../dtos/createHelpQuery.dto";
import { HelpQueryEntity } from "../entities/helpQuery.entity";

export class CreateHelpQueryUseCase {
  constructor(private helpQueryRepo: IHelpQueryRepository) {}

  async execute(data: CreateHelpQueryDTO): Promise<HelpQueryEntity> {
    if (!data.query) throw new Error("Query is required");
    return this.helpQueryRepo.createHelpQuery(data);
  }
}

export class GetAllHelpQueriesUseCase {
  constructor(private helpQueryRepo: IHelpQueryRepository) {}

  async execute(): Promise<HelpQueryEntity[]> {
    return this.helpQueryRepo.getAllHelpQueries();
  }
}
