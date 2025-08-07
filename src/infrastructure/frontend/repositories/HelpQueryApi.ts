import { HelpQueryEntity } from "@/core/entities/helpQuery.entity";
import { CreateHelpQueryDTO } from "@/core/dtos/createHelpQuery.dto";
import { IHelpQueryRepository } from "@/core/repositories/IHelpQueryRepository";

export class HelpQueryApiRepository implements IHelpQueryRepository {
  async createHelpQuery(data: CreateHelpQueryDTO): Promise<HelpQueryEntity> {
    try {
      const response = await fetch("/api/help", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Unknown error occurred" }));
        console.error(
          "Failed to submit help query:",
          response.status,
          errorData
        );
        throw new Error(
          errorData.message ||
            `Failed to submit help query. Status: ${response.status}`
        );
      }

      const result = await response.json();
      return result.helpQuery;
    } catch (error) {
      console.error(
        "Network or unexpected error during createHelpQuery:",
        error
      );
      throw error;
    }
  }

  async getAllHelpQueries(): Promise<HelpQueryEntity[]> {
    try {
      const response = await fetch("/api/help", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Unknown error occurred" }));
        console.error(
          "Failed to fetch help queries:",
          response.status,
          errorData
        );
        throw new Error(
          errorData.message ||
            `Failed to fetch help queries. Status: ${response.status}`
        );
      }

      const result = await response.json();
      return result.helpQueries;
    } catch (error) {
      console.error(
        "Network or unexpected error during getAllHelpQueries:",
        error
      );
      throw error;
    }
  }
}
