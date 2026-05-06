export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

const allowedStatuses = ["pending", "accepted", "completed", "cancelled"];

export async function GET() {
  try {
    const reservations = await prisma.reservation.findMany({
      orderBy: {
        startDatetime: "desc",
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

    return NextResponse.json({
      success: true,
      reservations,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to load reservations.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const id = String(body.id || "");
    const ids = Array.isArray(body.ids) ? body.ids : [];
    const status = String(body.status || "");

    if (!status || !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid reservation status." },
        { status: 400 }
      );
    }

    if (ids.length > 0) {
      await prisma.reservation.updateMany({
        where: {
          id: {
            in: ids,
          },
        },
        data: {
          status,
        },
      });

      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Reservation ID is required." },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      reservation,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to update reservation.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();

    const id = String(body.id || "");
    const ids = Array.isArray(body.ids) ? body.ids : [];

    if (ids.length > 0) {
      await prisma.reservation.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });

      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Reservation ID is required." },
        { status: 400 }
      );
    }

    await prisma.reservation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to delete reservation.",
      },
      { status: 500 }
    );
  }
}