export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

type ReservationAddon = {
  groupName: string;
  optionName: string;
  optionPrice: number;
};

type ReservationMenuItem = {
  id: string;
  qty: number;
  unitPrice: number;
  addonsTotal: number;
  addons: ReservationAddon[];
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const date = String(body.date || "");
    const time = String(body.time || "");
    const name = String(body.name || "");
    const phone = String(body.phone || "");
    const email = String(body.email || "");
    const partySize = Number(body.partySize || 2);
    const babySeats = Number(body.babySeats || 0);
    const preferredTable = body.preferredTable ? Number(body.preferredTable) : null;
    const notes = String(body.notes || "");
    const selectedItems = Array.isArray(body.items)
      ? (body.items as ReservationMenuItem[])
      : [];

    if (!date || !time || !name || !phone) {
      return NextResponse.json(
        { success: false, message: "Date, time, name and phone are required." },
        { status: 400 }
      );
    }

    const startDatetime = new Date(`${date}T${time}:00`);

    if (Number.isNaN(startDatetime.getTime())) {
      return NextResponse.json(
        { success: false, message: "Invalid reservation date or time." },
        { status: 400 }
      );
    }

    const cleanItems = selectedItems
      .filter((item) => item.id && Number(item.qty || 0) > 0)
      .map((item) => ({
        menuItemId: item.id,
        qty: Number(item.qty || 1),
        unitPrice: Number(item.unitPrice || 0),
        addonsTotal: Number(item.addonsTotal || 0),
        addonSnapshots: {
          create: (item.addons || []).map((addon) => ({
            groupName: addon.groupName,
            optionName: addon.optionName,
            optionPrice: Number(addon.optionPrice || 0),
          })),
        },
      }));

    const reservation = await prisma.reservation.create({
      data: {
        startDatetime,
        name,
        phone,
        email,
        partySize,
        babySeats,
        preferredTable,
        tablesNeeded: Math.ceil(partySize / 4),
        notes,
        status: "pending",
        items: {
          create: cleanItems,
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
            addonSnapshots: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, reservation });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to create reservation.",
      },
      { status: 500 }
    );
  }
}