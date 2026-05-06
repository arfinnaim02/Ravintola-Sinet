export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

/**
 * IMPORTANT:
 * If you already protect /admin/* with middleware or a layout guard,
 * keep using that.
 *
 * If you do NOT already guard admin routes elsewhere, add your admin
 * authorization check here before running any query.
 */

function getDateRange(start?: string | null, end?: string | null) {
  const today = new Date();

  const fallbackStart = new Date(today);
  fallbackStart.setDate(today.getDate() - 6);
  fallbackStart.setHours(0, 0, 0, 0);

  const fallbackEnd = new Date(today);
  fallbackEnd.setHours(23, 59, 59, 999);

  const startDate = start
    ? new Date(`${start}T00:00:00`)
    : fallbackStart;

  const endDate = end
    ? new Date(`${end}T23:59:59`)
    : fallbackEnd;

  return {
    startDate,
    endDate,
  };
}

function isCancelled(status: string) {
  return status === "cancelled";
}

function money(value: number) {
  return `€${Number(value || 0).toFixed(2)}`;
}

export async function GET(request: NextRequest) {
  try {
    const prisma = await getPrisma();

    const start = request.nextUrl.searchParams.get("start");
    const end = request.nextUrl.searchParams.get("end");

    const { startDate, endDate } = getDateRange(start, end);

    const orderWhere = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    const [
      categoryCount,
      menuItemCount,
      addonGroupCount,
      bannerCount,
      orders,
      reservations,
      recentOrders,
      topItems,
      contactCount,
      activeCoupons,
    ] = await Promise.all([
      prisma.category.count(),

      prisma.menuItem.count(),

      prisma.addonGroup.count(),

      prisma.heroBanner.count(),

      prisma.deliveryOrder.findMany({
        where: orderWhere,
        include: {
          items: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.reservation.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.deliveryOrder.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
        include: {
          items: true,
        },
      }),

      prisma.deliveryOrderItem.groupBy({
        by: ["name"],
        _sum: {
          qty: true,
        },
        orderBy: {
          _sum: {
            qty: "desc",
          },
        },
        take: 6,
      }),

      prisma.contactMessage.count(),

      prisma.deliveryCoupon.count({
        where: {
          isActive: true,
        },
      }),
    ]);

    const validOrders = orders.filter(
      (order) => !isCancelled(order.status)
    );

    const totalSales = validOrders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0
    );

    const totalDeliveryFee = validOrders.reduce(
      (sum, order) => sum + Number(order.deliveryFee || 0),
      0
    );

    const totalDiscount = validOrders.reduce(
      (sum, order) => sum + Number(order.couponDiscount || 0),
      0
    );

    const totalItemsSold = validOrders.reduce(
      (sum, order) =>
        sum +
        order.items.reduce(
          (itemSum, item) =>
            itemSum + Number(item.qty || 0),
          0
        ),
      0
    );

    const averageOrderValue =
      validOrders.length > 0
        ? totalSales / validOrders.length
        : 0;

    const pendingOrders = orders.filter(
      (order) => order.status === "pending"
    ).length;

    const completedOrders = orders.filter(
      (order) => order.status === "completed"
    ).length;

    const cancelledOrders = orders.filter(
      (order) => order.status === "cancelled"
    ).length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter((order) => {
      const created = new Date(order.createdAt);

      return created >= today && !isCancelled(order.status);
    });

    const todaySales = todayOrders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0
    );

    const quickCards = [
      {
        label: "Categories",
        value: categoryCount,
        href: "/admin/categories",
      },
      {
        label: "Menu Items",
        value: menuItemCount,
        href: "/admin/menu-items",
      },
      {
        label: "Addon Groups",
        value: addonGroupCount,
        href: "/admin/addons",
      },
      {
        label: "Hero Banners",
        value: bannerCount,
        href: "/admin/banners",
      },
      {
        label: "Active Coupons",
        value: activeCoupons,
        href: "/admin/coupons",
      },
      {
        label: "Messages",
        value: contactCount,
        href: "/admin/messages",
      },
    ];

    const kpis = [
      {
        label: "Total Sales",
        value: money(totalSales),
        note: "Non-cancelled orders",
      },
      {
        label: "Total Orders",
        value: String(orders.length),
        note: `${validOrders.length} valid orders`,
      },
      {
        label: "Today Sales",
        value: money(todaySales),
        note: `${todayOrders.length} order(s) today`,
      },
      {
        label: "Average Order",
        value: money(averageOrderValue),
        note: "Average order value",
      },
      {
        label: "Items Sold",
        value: String(totalItemsSold),
        note: "Total quantity sold",
      },
      {
        label: "Reservations",
        value: String(reservations.length),
        note: "Reservations in selected range",
      },
      {
        label: "Delivery Fees",
        value: money(totalDeliveryFee),
        note: "Collected delivery fees",
      },
      {
        label: "Discount Given",
        value: money(totalDiscount),
        note: "Coupon discounts",
      },
    ];

    return NextResponse.json({
      ok: true,

      data: {
        range: {
          start: startDate.toISOString().slice(0, 10),
          end: endDate.toISOString().slice(0, 10),
        },

        quickCards,

        kpis,

        statusCounts: {
          pendingOrders,
          completedOrders,
          cancelledOrders,
        },

        recentOrders: recentOrders.map((order) => ({
          id: order.id,
          customerName: order.customerName,
          createdAt: order.createdAt.toISOString(),
          status: order.status,
          total: Number(order.total || 0),
          addressLabel: order.addressLabel,
          itemCount: order.items.length,
        })),

        topItems: topItems.map((item) => ({
          name: item.name,
          sold: Number(item._sum.qty || 0),
        })),
      },
    });
  } catch (error) {
    console.error("Admin dashboard API error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unknown server error";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}