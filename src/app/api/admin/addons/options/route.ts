
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const groupId = String(body.groupId || "");
    const name = String(body.name || "").trim();

    if (!groupId || !name) {
      return NextResponse.json(
        { success: false, message: "Group and option name are required." },
        { status: 400 }
      );
    }

    const option = await prisma.addonOption.create({
      data: {
        groupId,
        name,
        price: Number(body.price || 0),
        order: Number(body.order || 0),
        isActive: Boolean(body.isActive),
      },
    });

    return NextResponse.json({ success: true, option });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to create option." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const id = String(body.id || "");
    const name = String(body.name || "").trim();

    if (!id || !name) {
      return NextResponse.json(
        { success: false, message: "Option ID and name are required." },
        { status: 400 }
      );
    }

    const option = await prisma.addonOption.update({
      where: { id },
      data: {
        name,
        price: Number(body.price || 0),
        order: Number(body.order || 0),
        isActive: Boolean(body.isActive),
      },
    });

    return NextResponse.json({ success: true, option });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to update option." },
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
        { success: false, message: "Option ID is required." },
        { status: 400 }
      );
    }

    await prisma.addonOption.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to delete option." },
      { status: 500 }
    );
  }
}