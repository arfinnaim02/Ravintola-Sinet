export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Login required." },
      { status: 401 }
    );
  }

  const addresses = await prisma.customerAddress.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ success: true, addresses });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Login required." },
      { status: 401 }
    );
  }

  const body = await request.json();

  const label = String(body.label || "Home").trim();
  const addressLabel = String(body.addressLabel || "").trim();
  const addressExtra = String(body.addressExtra || "").trim();
  const lat = Number(body.lat || 0);
  const lng = Number(body.lng || 0);
  const distanceKm = Number(body.distanceKm || 0);
  const isDefault = Boolean(body.isDefault);

  if (!addressLabel || !lat || !lng) {
    return NextResponse.json(
      { success: false, message: "Valid address is required." },
      { status: 400 }
    );
  }

  if (isDefault) {
    await prisma.customerAddress.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    });
  }

  const address = await prisma.customerAddress.create({
    data: {
      userId: user.id,
      label,
      addressLabel,
      addressExtra,
      lat,
      lng,
      distanceKm,
      isDefault,
    },
  });

  return NextResponse.json({ success: true, address });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Login required." },
      { status: 401 }
    );
  }

  const body = await request.json();
  const id = String(body.id || "");
  const isDefault = Boolean(body.isDefault);

  if (!id) {
    return NextResponse.json(
      { success: false, message: "Address ID is required." },
      { status: 400 }
    );
  }

  const existing = await prisma.customerAddress.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json(
      { success: false, message: "Address not found." },
      { status: 404 }
    );
  }

  if (isDefault) {
    await prisma.customerAddress.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    });
  }

  const address = await prisma.customerAddress.update({
    where: { id },
    data: {
      label: String(body.label || existing.label),
      addressExtra: String(body.addressExtra || ""),
      isDefault,
    },
  });

  return NextResponse.json({ success: true, address });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Login required." },
      { status: 401 }
    );
  }

  const body = await request.json();
  const id = String(body.id || "");

  await prisma.customerAddress.deleteMany({
    where: { id, userId: user.id },
  });

  return NextResponse.json({ success: true });
}