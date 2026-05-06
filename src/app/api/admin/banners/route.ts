export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import path from "path";


const uploadDir = path.join(process.cwd(), "public", "uploaded-banners");

async function saveImage(file: File | null, prefix: string) {
  if (!file || file.size === 0) return "";

  await mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const extension = file.name.split(".").pop() || "webp";
  const fileName = `${prefix}-${Date.now()}.${extension}`;
  const filePath = path.join(uploadDir, fileName);

  await writeFile(filePath, buffer);

  return `/uploaded-banners/${fileName}`;
}

export async function GET() {
  try {
    const banners = await prisma.heroBanner.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, banners });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to load banners." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const desktopFile = formData.get("image") as File | null;
    const mobileFile = formData.get("mobileImage") as File | null;

    const image = await saveImage(desktopFile, "desktop");
    const mobileImage = await saveImage(mobileFile, "mobile");

    if (!image) {
      return NextResponse.json(
        { success: false, message: "Desktop banner image is required." },
        { status: 400 }
      );
    }

    const banner = await prisma.heroBanner.create({
      data: {
        image,
        mobileImage: mobileImage || null,
        eyebrow: String(formData.get("eyebrow") || ""),
        title: String(formData.get("title") || ""),
        subtitle: String(formData.get("subtitle") || ""),
        buttonText: String(formData.get("buttonText") || ""),
        buttonUrl: String(formData.get("buttonUrl") || ""),
        order: Number(formData.get("order") || 0),
        isActive: String(formData.get("isActive")) === "true",
      },
    });

    return NextResponse.json({ success: true, banner });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to create banner." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const formData = await request.formData();

    const id = String(formData.get("id") || "");
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Banner ID is required." },
        { status: 400 }
      );
    }

    const desktopFile = formData.get("image") as File | null;
    const mobileFile = formData.get("mobileImage") as File | null;

    const newImage = await saveImage(desktopFile, "desktop");
    const newMobileImage = await saveImage(mobileFile, "mobile");

    const banner = await prisma.heroBanner.update({
      where: { id },
      data: {
        ...(newImage ? { image: newImage } : {}),
        ...(newMobileImage ? { mobileImage: newMobileImage } : {}),
        eyebrow: String(formData.get("eyebrow") || ""),
        title: String(formData.get("title") || ""),
        subtitle: String(formData.get("subtitle") || ""),
        buttonText: String(formData.get("buttonText") || ""),
        buttonUrl: String(formData.get("buttonUrl") || ""),
        order: Number(formData.get("order") || 0),
        isActive: String(formData.get("isActive")) === "true",
      },
    });

    return NextResponse.json({ success: true, banner });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to update banner." },
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
        { success: false, message: "Banner ID is required." },
        { status: 400 }
      );
    }

    await prisma.heroBanner.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to delete banner." },
      { status: 500 }
    );
  }
}