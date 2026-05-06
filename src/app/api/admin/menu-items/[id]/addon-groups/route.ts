export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const menuItemId = params.id;
    const addonGroupId = String(body.addonGroupId || "");

    if (!menuItemId || !addonGroupId) {
      return NextResponse.json(
        { success: false, message: "Menu item and addon group are required." },
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
          body.isRequiredOverride === "" ? null : Boolean(body.isRequiredOverride),
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
          body.isRequiredOverride === "" ? null : Boolean(body.isRequiredOverride),
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
      { success: false, message: error?.message || "Failed to assign addon group." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const menuItemId = params.id;
    const addonGroupId = String(body.addonGroupId || "");

    if (!menuItemId || !addonGroupId) {
      return NextResponse.json(
        { success: false, message: "Menu item and addon group are required." },
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
      { success: false, message: error?.message || "Failed to remove addon group." },
      { status: 500 }
    );
  }
}