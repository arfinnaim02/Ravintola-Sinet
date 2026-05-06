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
    const addonGroups = await prisma.addonGroup.findMany({
      include: {
        options: {
          orderBy: [{ order: "asc" }, { name: "asc" }],
        },
        _count: {
          select: {
            menuItemLinks: true,
          },
        },
      },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ success: true, addonGroups });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to load addons." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name || "").trim();
    const slugInput = String(body.slug || "").trim();

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Addon group name is required." },
        { status: 400 }
      );
    }

    const group = await prisma.addonGroup.create({
      data: {
        name,
        slug: slugInput ? slugify(slugInput) : slugify(name),
        selectionType: String(body.selectionType || "multiple"),
        isActive: Boolean(body.isActive),
        isRequired: Boolean(body.isRequired),
        minSelect: Number(body.minSelect || 0),
        maxSelect:
          body.maxSelect === "" || body.maxSelect === null
            ? null
            : Number(body.maxSelect),
        freeChoicesCount: Number(body.freeChoicesCount || 0),
        order: Number(body.order || 0),
      },
    });

    return NextResponse.json({ success: true, group });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to create addon group." },
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

    if (!id || !name) {
      return NextResponse.json(
        { success: false, message: "Addon group ID and name are required." },
        { status: 400 }
      );
    }

    const group = await prisma.addonGroup.update({
      where: { id },
      data: {
        name,
        slug: slugInput ? slugify(slugInput) : slugify(name),
        selectionType: String(body.selectionType || "multiple"),
        isActive: Boolean(body.isActive),
        isRequired: Boolean(body.isRequired),
        minSelect: Number(body.minSelect || 0),
        maxSelect:
          body.maxSelect === "" || body.maxSelect === null
            ? null
            : Number(body.maxSelect),
        freeChoicesCount: Number(body.freeChoicesCount || 0),
        order: Number(body.order || 0),
      },
    });

    return NextResponse.json({ success: true, group });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to update addon group." },
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
        { success: false, message: "Addon group ID is required." },
        { status: 400 }
      );
    }

    const assignedCount = await prisma.menuItemAddonGroup.count({
      where: { addonGroupId: id },
    });

    if (assignedCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "This addon group is assigned to menu items. Remove assignments first.",
        },
        { status: 400 }
      );
    }

    await prisma.addonGroup.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to delete addon group." },
      { status: 500 }
    );
  }
}