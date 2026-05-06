export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const orders = await prisma.deliveryOrder.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            addonSnapshots: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      data: orders.map((order) => ({
        ...order,
        createdAt: order.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Account orders API error:", error);

    const message =
      error instanceof Error ? error.message : "Unknown server error";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
