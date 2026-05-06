export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
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

    const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((review) => review.rating === star).length,
    }));

    return NextResponse.json({
      success: true,
      reviews,
      totalReviews,
      averageRating,
      ratingBreakdown,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to load reviews.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name || "").trim();
    const comment = String(body.comment || "").trim();
    const rating = Number(body.rating || 0);

    if (!name || !comment || rating < 1 || rating > 5) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, comment and a rating from 1 to 5 are required.",
        },
        { status: 400 }
      );
    }

    const review = await prisma.review.create({
      data: {
        name,
        comment,
        rating,
      },
    });

    return NextResponse.json({
      success: true,
      review,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to submit review.",
      },
      { status: 500 }
    );
  }
}