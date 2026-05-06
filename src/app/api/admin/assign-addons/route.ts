export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  try {
    const [menuItems, addonGroups] = await Promise.all([
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
        orderBy: [{ name: "asc" }],
      }),

      prisma.addonGroup.findMany({
        where: {
          isActive: true,
        },
        orderBy: [{ order: "asc" }, { name: "asc" }],
      }),
    ]);

    return NextResponse.json({
      success: true,
      menuItems,
      addonGroups,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to load assignment data.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const menuItemId = String(body.menuItemId || "");
    const addonGroupId = String(body.addonGroupId || "");

    if (!menuItemId || !addonGroupId) {
      return NextResponse.json(
        {
          success: false,
          message: "Menu item and addon group are required.",
        },
        { status: 400 }
      );
    }

    const link = await prisma.menuItemAddonGroup.upsert({
      where: {
        menuItemId_addonGroupId: {
          menuItemId,
          addonGroupId,
        },
      },
      update: {
        order: Number(body.order || 0),
        isRequiredOverride:
          body.isRequiredOverride === "" || body.isRequiredOverride === null
            ? null
            : Boolean(body.isRequiredOverride),
        minSelectOverride:
          body.minSelectOverride === "" || body.minSelectOverride === null
            ? null
            : Number(body.minSelectOverride),
        maxSelectOverride:
          body.maxSelectOverride === "" || body.maxSelectOverride === null
            ? null
            : Number(body.maxSelectOverride),
        freeChoicesCountOverride:
          body.freeChoicesCountOverride === "" ||
          body.freeChoicesCountOverride === null
            ? null
            : Number(body.freeChoicesCountOverride),
      },
      create: {
        menuItemId,
        addonGroupId,
        order: Number(body.order || 0),
        isRequiredOverride:
          body.isRequiredOverride === "" || body.isRequiredOverride === null
            ? null
            : Boolean(body.isRequiredOverride),
        minSelectOverride:
          body.minSelectOverride === "" || body.minSelectOverride === null
            ? null
            : Number(body.minSelectOverride),
        maxSelectOverride:
          body.maxSelectOverride === "" || body.maxSelectOverride === null
            ? null
            : Number(body.maxSelectOverride),
        freeChoicesCountOverride:
          body.freeChoicesCountOverride === "" ||
          body.freeChoicesCountOverride === null
            ? null
            : Number(body.freeChoicesCountOverride),
      },
    });

    return NextResponse.json({ success: true, link });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to save addon assignment.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();

    const menuItemId = String(body.menuItemId || "");
    const addonGroupId = String(body.addonGroupId || "");

    if (!menuItemId || !addonGroupId) {
      return NextResponse.json(
        {
          success: false,
          message: "Menu item and addon group are required.",
        },
        { status: 400 }
      );
    }

    await prisma.menuItemAddonGroup.delete({
      where: {
        menuItemId_addonGroupId: {
          menuItemId,
          addonGroupId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to remove addon assignment.",
      },
      { status: 500 }
    );
  }
}