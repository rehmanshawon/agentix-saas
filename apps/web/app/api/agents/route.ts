import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma"; // Adjust relative path based on your actual prisma export
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth"; // Adjust path based on where you move this route

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const workspaceId = session?.user?.workspaceId;

    if (!workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agent = await prisma.agent.findFirst({
      where: { workspaceId },
    });

    return NextResponse.json({ agent }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, systemPrompt, model, primaryColor } = body;

    // Get the active session safely on the server side
    const session = await getServerSession(authOptions);
    const workspaceId = session?.user?.workspaceId;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Unauthorized: No workspace found" },
        { status: 401 },
      );
    }

    const existingAgent = await prisma.agent.findFirst({
      where: { workspaceId },
    });

    let agent;
    if (existingAgent) {
      agent = await prisma.agent.update({
        where: { id: existingAgent.id },
        data: { name, systemPrompt, modelName: model, colorHex: primaryColor },
      });
    } else {
      agent = await prisma.agent.create({
        data: {
          name,
          systemPrompt,
          modelName: model,
          colorHex: primaryColor,
          workspaceId,
        },
      });
    }

    return NextResponse.json({ success: true, agent }, { status: 200 });
  } catch (error: any) {
    console.error("[Agent API] Failed to save agent configuration:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
