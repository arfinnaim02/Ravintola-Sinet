export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { uploadImageToCloudinary } from "../../../../lib/cloudinary";

async function getPrisma() {
  const { prisma } = await import("../../../../lib/prisma");
  return prisma;
}

function safeNumber(value: FormDataEntryValue | null) {
  return Number(value || 0);
}

function safeString(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

function serializeMenuItem(item: any) {
  return {
    ...item,
    price: Number(item.price || 0),
    createdAt: item.createdAt ? item.createdAt.toISOString() : null,
    updatedAt: item.updatedAt ? item.updatedAt.toISOString() : null,
  };
}

export async function GET() {
  try {
    const prisma = await getPrisma();

    const [items, categories] = await Promise.all([
      prisma.menuItem.findMany({
        include: {
          category: true,
          addonGroupLinks: {
            include: {
              addonGroup: true,
            },
            orderBy: {
              order: "asc",
            },
          },
        },
        orderBy: [{ createdAt: "desc" }],
      }),
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: [{ order: "asc" }, { name: "asc" }],
      }),
    ]);

    return NextResponse.json({
      success: true,
      items: items.map(serializeMenuItem),
      categories,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to load menu items.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const prisma = await getPrisma();
    const formData = await request.formData();

    const name = safeString(formData.get("name"));
    const categoryId = safeString(formData.get("categoryId"));
    const price = safeNumber(formData.get("price"));

    if (!name || !categoryId || price <= 0) {
      return NextResponse.json(
        { success: false, message: "Name, category and price are required." },
        { status: 400 }
      );
    }

    const imageFile = formData.get("imageFile") as File | null;
    const image = await uploadImageToCloudinary(imageFile, "menu-items");

    const item = await prisma.menuItem.create({
      data: {
        name,
        categoryId,
        price,
        image: image || "",
        description: safeString(formData.get("description")),
        tags: safeString(formData.get("tags")),
        allergens: safeString(formData.get("allergens")),
        status: safeString(formData.get("status")) || "active",
      },
    });

    return NextResponse.json({
      success: true,
      item: serializeMenuItem(item),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to create menu item.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const prisma = await getPrisma();
    const formData = await request.formData();

    const id = safeString(formData.get("id"));
    const name = safeString(formData.get("name"));
    const categoryId = safeString(formData.get("categoryId"));
    const price = safeNumber(formData.get("price"));

    if (!id || !name || !categoryId || price <= 0) {
      return NextResponse.json(
        { success: false, message: "ID, name, category and price are required." },
        { status: 400 }
      );
    }

    const imageFile = formData.get("imageFile") as File | null;
    const currentImage = safeString(formData.get("currentImage"));
    const newImage = await uploadImageToCloudinary(imageFile, "menu-items");

    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        name,
        categoryId,
        price,
        image: newImage || currentImage || "",
        description: safeString(formData.get("description")),
        tags: safeString(formData.get("tags")),
        allergens: safeString(formData.get("allergens")),
        status: safeString(formData.get("status")) || "active",
      },
    });

    return NextResponse.json({
      success: true,
      item: serializeMenuItem(item),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to update menu item.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const prisma = await getPrisma();
    const body = await request.json();
    const id = String(body.id || "");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Menu item ID is required." },
        { status: 400 }
      );
    }

    await prisma.menuItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to delete menu item.",
      },
      { status: 500 }
    );
  }
}