import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { HelpQueryRepository } from "@/core/repositories/IHelpQueryRepository";
import {
  CreateHelpQueryUseCase,
  GetAllHelpQueriesUseCase,
} from "@/core/usecases/HelpRepository.usecase";

const helpQueryRepo = new HelpQueryRepository(prisma);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, userEmail } = body;
    const usecase = new CreateHelpQueryUseCase(helpQueryRepo);
    const helpQuery = await usecase.execute({ query, userEmail });
    return NextResponse.json({ success: true, helpQuery });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}

export async function GET() {
  try {
    const usecase = new GetAllHelpQueriesUseCase(helpQueryRepo);
    const helpQueries = await usecase.execute();
    return NextResponse.json({ success: true, helpQueries });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
