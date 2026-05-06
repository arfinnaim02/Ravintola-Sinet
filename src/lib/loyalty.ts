import { prisma } from "./prisma";

function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthRange(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);

  const start = new Date(year, month - 1, 1, 0, 0, 0);
  const end = new Date(year, month, 1, 0, 0, 0);

  return { start, end };
}

function generateLoyaltyCode(prefix: string, percent: number, monthKey: string) {
  const cleanMonth = monthKey.replace("-", "");
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();

  return `${prefix}${percent}-${cleanMonth}-${random}`;
}

export async function ensureDefaultLoyaltyProgram() {
  const existing = await prisma.loyaltyProgram.findFirst();

  if (existing) return existing;

  return prisma.loyaltyProgram.create({
    data: {
      isActive: true,
      targetOrders: 10,
      rewardPercent: 30,
      couponPrefix: "LOYAL",
      maxUses: 1,
      minSubtotal: 0,
    },
  });
}

export async function getLoyaltyProgress(userId: string) {
  const program = await ensureDefaultLoyaltyProgram();
  const issuedMonth = getMonthKey();
  const { start, end } = monthRange(issuedMonth);

  const deliveredCount = await prisma.deliveryOrder.count({
    where: {
      userId,
      status: "completed",
      createdAt: {
        gte: start,
        lt: end,
      },
    },
  });

  const reward = await prisma.loyaltyReward.findUnique({
    where: {
      userId_issuedMonth: {
        userId,
        issuedMonth,
      },
    },
  });

  return {
    program,
    issuedMonth,
    deliveredCount,
    remainingOrders: Math.max(0, program.targetOrders - deliveredCount),
    reward,
    rewardUnlocked: Boolean(reward),
  };
}

export async function checkAndGenerateLoyaltyReward(userId: string) {
  const program = await ensureDefaultLoyaltyProgram();

  if (!program.isActive) {
    return null;
  }

  const issuedMonth = getMonthKey();
  const { start, end } = monthRange(issuedMonth);

  const existingReward = await prisma.loyaltyReward.findUnique({
    where: {
      userId_issuedMonth: {
        userId,
        issuedMonth,
      },
    },
  });

  if (existingReward) {
    return existingReward;
  }

  const deliveredCount = await prisma.deliveryOrder.count({
    where: {
      userId,
      status: "completed",
      createdAt: {
        gte: start,
        lt: end,
      },
    },
  });

  if (deliveredCount < program.targetOrders) {
    return null;
  }

  let couponCode = generateLoyaltyCode(
    program.couponPrefix || "LOYAL",
    program.rewardPercent,
    issuedMonth
  );

  let exists = await prisma.deliveryCoupon.findUnique({
    where: { code: couponCode },
  });

  while (exists) {
    couponCode = generateLoyaltyCode(
      program.couponPrefix || "LOYAL",
      program.rewardPercent,
      issuedMonth
    );

    exists = await prisma.deliveryCoupon.findUnique({
      where: { code: couponCode },
    });
  }

  await prisma.deliveryCoupon.create({
    data: {
      code: couponCode,
      isActive: true,
      isPersonal: true,
      issuedMonth,
      discountType: "percent",
      discountValue: program.rewardPercent,
      minSubtotal: Number(program.minSubtotal || 0),
      maxUses: program.maxUses,
      featuredTitle: `${program.rewardPercent}% loyalty reward`,
      featuredSubtitle: "Thank you for ordering with Ravintola Sinet.",
      featuredIcon: "gift",
      isFeatured: false,
    },
  });

  return prisma.loyaltyReward.create({
    data: {
      userId,
      issuedMonth,
      orderCount: deliveredCount,
      couponCode,
      rewardPercent: program.rewardPercent,
    },
  });
}