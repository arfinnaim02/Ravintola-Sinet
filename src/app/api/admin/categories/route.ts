export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            menuItems: true,
          },
        },
      },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to load categories." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name || "").trim();
    const slugInput = String(body.slug || "").trim();
    const order = Number(body.order || 0);
    const isActive = Boolean(body.isActive);

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Category name is required." },
        { status: 400 }
      );
    }

    const slug = slugInput ? slugify(slugInput) : slugify(name);

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        order,
        isActive,
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to create category." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const id = String(body.id || "");
    const name = String(body.name || "").trim();
    const slugInput = String(body.slug || "").trim();
    const order = Number(body.order || 0);
    const isActive = Boolean(body.isActive);

    if (!id || !name) {
      return NextResponse.json(
        { success: false, message: "Category ID and name are required." },
        { status: 400 }
      );
    }

    const slug = slugInput ? slugify(slugInput) : slugify(name);

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
        order,
        isActive,
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to update category." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const id = String(body.id || "");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Category ID is required." },
        { status: 400 }
      );
    }

    const itemCount = await prisma.menuItem.count({
      where: { categoryId: id },
    });

    if (itemCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "This category has menu items. Move or delete those items first.",
        },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to delete category." },
      { status: 500 }
    );
  }
}