export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import path from "path";


const uploadDir = path.join(process.cwd(), "public", "uploaded-menu-items");

async function saveImage(file: File | null) {
  if (!file || file.size === 0) return "";

  await mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const extension = file.name.split(".").pop() || "webp";
  const fileName = `menu-${Date.now()}.${extension}`;
  const filePath = path.join(uploadDir, fileName);

  await writeFile(filePath, buffer);

  return `/uploaded-menu-items/${fileName}`;
}

export async function GET() {
  try {
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
      items,
      categories,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to load menu items." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const name = String(formData.get("name") || "").trim();
    const categoryId = String(formData.get("categoryId") || "");
    const price = Number(formData.get("price") || 0);

    if (!name || !categoryId || price <= 0) {
      return NextResponse.json(
        { success: false, message: "Name, category and price are required." },
        { status: 400 }
      );
    }

    const imageFile = formData.get("imageFile") as File | null;
    const image = await saveImage(imageFile);

    const item = await prisma.menuItem.create({
      data: {
        name,
        categoryId,
        price,
        image: image || "",
        description: String(formData.get("description") || ""),
        tags: String(formData.get("tags") || ""),
        allergens: String(formData.get("allergens") || ""),
        status: String(formData.get("status") || "active"),
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to create menu item." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const formData = await request.formData();

    const id = String(formData.get("id") || "");
    const name = String(formData.get("name") || "").trim();
    const categoryId = String(formData.get("categoryId") || "");
    const price = Number(formData.get("price") || 0);

    if (!id || !name || !categoryId || price <= 0) {
      return NextResponse.json(
        { success: false, message: "ID, name, category and price are required." },
        { status: 400 }
      );
    }

    const imageFile = formData.get("imageFile") as File | null;
    const newImage = await saveImage(imageFile);

    const currentImage = String(formData.get("currentImage") || "");

    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        name,
        categoryId,
        price,
        image: newImage || currentImage || "",
        description: String(formData.get("description") || ""),
        tags: String(formData.get("tags") || ""),
        allergens: String(formData.get("allergens") || ""),
        status: String(formData.get("status") || "active"),
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to update menu item." },
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
      { success: false, message: error?.message || "Failed to delete menu item." },
      { status: 500 }
    );
  }
}