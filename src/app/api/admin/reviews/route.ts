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

    const reviews = await prisma.review.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalReviews = reviews.length;

    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0;

    return NextResponse.json({
      success: true,
      reviews,
      totalReviews,
      averageRating,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to load reviews." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const prisma = await getPrisma();
    const body = await request.json();

    const id = String(body.id || "");
    const ids = Array.isArray(body.ids) ? body.ids : [];

    if (ids.length > 0) {
      await prisma.review.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });

      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Review ID is required." },
        { status: 400 }
      );
    }

    await prisma.review.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to delete review." },
      { status: 500 }
    );
  }
}