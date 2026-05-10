export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { uploadImageToCloudinary } from "../../../../lib/cloudinary";

async function getPrisma() {
  const { prisma } = await import("../../../../lib/prisma");
  return prisma;
}

function safeString(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

function safeNumber(value: FormDataEntryValue | null) {
  return Number(value || 0);
}

function safeBoolean(value: FormDataEntryValue | null) {
  return String(value) === "true";
}

function serializeBanner(banner: any) {
  return {
    ...banner,
    createdAt: banner.createdAt ? banner.createdAt.toISOString() : null,
    updatedAt: banner.updatedAt ? banner.updatedAt.toISOString() : null,
  };
}

export async function GET() {
  try {
    const prisma = await getPrisma();

    const banners = await prisma.heroBanner.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({
      success: true,
      banners: banners.map(serializeBanner),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to load banners.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const prisma = await getPrisma();
    const formData = await request.formData();

    const desktopFile = formData.get("image") as File | null;
    const mobileFile = formData.get("mobileImage") as File | null;

    const image = await uploadImageToCloudinary(desktopFile, "banners/desktop");
    const mobileImage = await uploadImageToCloudinary(
      mobileFile,
      "banners/mobile"
    );

    if (!image) {
      return NextResponse.json(
        {
          success: false,
          message: "Desktop banner image is required.",
        },
        { status: 400 }
      );
    }

    const banner = await prisma.heroBanner.create({
      data: {
        image,
        mobileImage: mobileImage || null,
        eyebrow: safeString(formData.get("eyebrow")),
        title: safeString(formData.get("title")),
        subtitle: safeString(formData.get("subtitle")),
        buttonText: safeString(formData.get("buttonText")),
        buttonUrl: safeString(formData.get("buttonUrl")),
        order: safeNumber(formData.get("order")),
        isActive: safeBoolean(formData.get("isActive")),
      },
    });

    return NextResponse.json({
      success: true,
      banner: serializeBanner(banner),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to create banner.",
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

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Banner ID is required.",
        },
        { status: 400 }
      );
    }

    const desktopFile = formData.get("image") as File | null;
    const mobileFile = formData.get("mobileImage") as File | null;

    const newImage = await uploadImageToCloudinary(
      desktopFile,
      "banners/desktop"
    );

    const newMobileImage = await uploadImageToCloudinary(
      mobileFile,
      "banners/mobile"
    );

    const banner = await prisma.heroBanner.update({
      where: { id },
      data: {
        ...(newImage ? { image: newImage } : {}),
        ...(newMobileImage ? { mobileImage: newMobileImage } : {}),
        eyebrow: safeString(formData.get("eyebrow")),
        title: safeString(formData.get("title")),
        subtitle: safeString(formData.get("subtitle")),
        buttonText: safeString(formData.get("buttonText")),
        buttonUrl: safeString(formData.get("buttonUrl")),
        order: safeNumber(formData.get("order")),
        isActive: safeBoolean(formData.get("isActive")),
      },
    });

    return NextResponse.json({
      success: true,
      banner: serializeBanner(banner),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to update banner.",
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
        {
          success: false,
          message: "Banner ID is required.",
        },
        { status: 400 }
      );
    }

    await prisma.heroBanner.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to delete banner.",
      },
      { status: 500 }
    );
  }
}