export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";

async function getPrisma() {
  const { prisma } = await import("../../../../lib/prisma");
  return prisma;
}

export async function GET() {
  try {
    const prisma = await getPrisma();

    const messages = await prisma.contactMessage.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      messages: messages.map((message) => ({
        ...message,
        createdAt: message.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to load contact messages.",
      },
      { status: 500 }
    );
  }
}