import { CreateHelpQueryDTO } from "../dtos/createHelpQuery.dto";
import { HelpQueryEntity } from "../entities/helpQuery.entity";
import { PrismaClient } from "@prisma/client";

export interface IHelpQueryRepository {
  createHelpQuery(data: CreateHelpQueryDTO): Promise<HelpQueryEntity>;
  getAllHelpQueries(): Promise<HelpQueryEntity[]>;
}
export class HelpQueryRepository implements IHelpQueryRepository {
  constructor(private prisma: PrismaClient) {}

  async createHelpQuery(data: CreateHelpQueryDTO): Promise<HelpQueryEntity> {
    return this.prisma.helpQuery.create({ data });
  }
  async getAllHelpQueries(): Promise<HelpQueryEntity[]> {
    return this.prisma.helpQuery.findMany();
  }
}
