import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "../../../../lib/prisma";

// Demo mode: Auto-grant a Starter subscription to new signups
const DEMO_MODE =
  process.env.DEMO_MODE === "true" || process.env.NODE_ENV === "development";
const DEMO_TIER = "STARTER";
const DEMO_TOKENS = 500;

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const passwordHash = await hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name || email.split("@")[0],
        email: email.toLowerCase(),
        passwordHash,
      },
    });

    // Create workspace — in demo mode, auto-grant a subscription
    const workspace = await prisma.workspace.create({
      data: {
        name: `${name || "My"} Workspace`,
        tokenBalance: DEMO_MODE ? DEMO_TOKENS : 0,
        subscriptionTier: DEMO_MODE ? DEMO_TIER : null,
      },
    });

    await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        role: "OWNER",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        ...(DEMO_MODE && {
          demo: true,
          tier: DEMO_TIER,
          tokens: DEMO_TOKENS,
        }),
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 },
    );
  }
}
