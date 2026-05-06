import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { id: "cat-pizzat", name: "Pizzat", slug: "pizzat", order: 1 },
  { id: "cat-kebabit", name: "Kebabit", slug: "kebabit", order: 2 },
  { id: "cat-juomat", name: "Juomat", slug: "juomat", order: 3 },
  { id: "cat-perhepizzat", name: "Perhepizzat", slug: "perhepizzat", order: 4 },
  { id: "cat-salaatit", name: "Salaatit", slug: "salaatit", order: 5 },
  { id: "cat-alkupalat", name: "Alkupalat", slug: "alkupalat", order: 6 },
  { id: "cat-muut", name: "Muut annokset", slug: "muut-annokset", order: 7 },
  { id: "cat-intialaiset", name: "Intialaisia leipiä", slug: "intialaisia-leipia", order: 8 },
  { id: "cat-falafelit", name: "Falafelit", slug: "falafelit", order: 9 },
  { id: "cat-grillista", name: "Grillistä", slug: "grillista", order: 10 },
];

const menuItems = [
  {
    id: "item-kananugetit-10",
    name: "Kananugetit (10 KPL)",
    price: "8.00",
    categoryId: "cat-muut",
    description:
      "Crispy on the outside and tender on the inside. Golden chicken nuggets, ideal for dipping.",
    tags: "favorite,popular",
  },
  {
    id: "item-muumi-05",
    name: "Muumi 0,5l",
    price: "3.50",
    categoryId: "cat-juomat",
    description: "500 ml",
    tags: "favorite",
  },
  {
    id: "item-iskender-kebab",
    name: "Iskender kebab",
    price: "9.99",
    categoryId: "cat-kebabit",
    description: "Iskender kebab",
    tags: "favorite,popular",
  },
  {
    id: "item-margarita-pizza",
    name: "Margarita Pizza",
    price: "9.00",
    categoryId: "cat-pizzat",
    description: "Tuore tomaatti, pizza kastike, juusto",
    tags: "classic",
  },
  {
    id: "item-kinkku-pizza",
    name: "Kinkku Pizza",
    price: "9.00",
    categoryId: "cat-pizzat",
    description: "Kinkku, pizza kastike, juusto",
    tags: "classic",
  },
  {
    id: "item-tropicana-pizza",
    name: "Tropicana Pizza",
    price: "9.00",
    categoryId: "cat-pizzat",
    description: "Ananas, kinkku, pizza kastike, juusto",
    tags: "",
  },
  {
    id: "item-vegetariana-pizza",
    name: "Vegetariana Pizza",
    price: "9.00",
    categoryId: "cat-pizzat",
    description: "Ananas, herkkusieni, paprika, punasipuli",
    tags: "vegetarian",
  },
  {
    id: "item-opera-special-pizza",
    name: "Opera Special Pizza",
    price: "10.00",
    categoryId: "cat-pizzat",
    description: "Kinkku, salami, tonnikala",
    tags: "popular",
  },
  {
    id: "item-romana-pizza",
    name: "Romana Pizza",
    price: "10.50",
    categoryId: "cat-pizzat",
    description: "Ananas, aurajuusto, kinkku",
    tags: "",
  },
  {
    id: "item-kebabpizza",
    name: "Kebabpizza",
    price: "12.00",
    categoryId: "cat-pizzat",
    description: "Fetajuusto, jalopeno, kananmuna, kebab-liha, sipuli",
    tags: "popular",
  },
  {
    id: "item-fantasia",
    name: "Fantasia",
    price: "10.90",
    categoryId: "cat-pizzat",
    description: "3 vapaavalintaista täytettä",
    tags: "offer",
  },
  {
    id: "item-pitakebab",
    name: "Pitakebab",
    price: "8.90",
    categoryId: "cat-kebabit",
    description: "Pitakebab",
    tags: "",
  },
  {
    id: "item-rullakebab",
    name: "Rullakebab",
    price: "8.99",
    categoryId: "cat-kebabit",
    description: "Rullakebab",
    tags: "offer,popular",
  },
  {
    id: "item-kebab-ranskalaisilla",
    name: "Kebab ranskalaisilla",
    price: "9.45",
    categoryId: "cat-kebabit",
    description: "Kebab ranskalaisilla",
    tags: "offer",
  },
  {
    id: "item-kebab-riisilla",
    name: "Kebab riisillä",
    price: "9.00",
    categoryId: "cat-kebabit",
    description: "Kebab riisillä",
    tags: "",
  },
  {
    id: "item-coca-cola-zero",
    name: "Coca-Cola Zero 0,5 l",
    price: "3.50",
    categoryId: "cat-juomat",
    description: "500 ml",
    tags: "",
  },
  {
    id: "item-mango-lassi",
    name: "Mango Lassi",
    price: "5.00",
    categoryId: "cat-juomat",
    description: "Mango Lassi",
    tags: "",
  },
  {
    id: "item-romana-perhe",
    name: "Romana Perhe Pizza",
    price: "14.94",
    categoryId: "cat-perhepizzat",
    description: "Ananas, aurajuusto, kinkku",
    tags: "offer",
  },
  {
    id: "item-kebab-perhe",
    name: "Kebab Perhe Pizza",
    price: "16.20",
    categoryId: "cat-perhepizzat",
    description: "Fetajuusto, jalopeno, kananmuna, kebab-liha, sipuli",
    tags: "offer",
  },
  {
    id: "item-vihrea-salaatti",
    name: "Vihreä Salaatti",
    price: "7.00",
    categoryId: "cat-salaatit",
    description: "Paprikaa, tomaattia ja kurkkua vihersalaatin kera",
    tags: "vegetarian",
  },
  {
    id: "item-naan",
    name: "Naan",
    price: "3.00",
    categoryId: "cat-intialaiset",
    description: "Tandooriuunissa paistettu ilmava leipä",
    tags: "",
  },
  {
    id: "item-garlic-naan",
    name: "Garlic Naan",
    price: "4.00",
    categoryId: "cat-intialaiset",
    description: "Valkosipulilla maustettu naanleipä",
    tags: "",
  },
  {
    id: "item-falafel-ranskalaisilla",
    name: "Falafel ranskalaisilla",
    price: "10.00",
    categoryId: "cat-falafelit",
    description: "Falafel ranskalaisilla",
    tags: "vegetarian",
  },
  {
    id: "item-grillilautanen",
    name: "Grillilautanen",
    price: "12.00",
    categoryId: "cat-grillista",
    description: "Grillilautanen",
    tags: "",
  },
];

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: category,
      create: category,
    });
  }

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        price: item.price,
        description: item.description,
        categoryId: item.categoryId,
        tags: item.tags,
        status: "active",
      },
      create: {
        id: item.id,
        name: item.name,
        price: item.price,
        description: item.description,
        categoryId: item.categoryId,
        tags: item.tags,
        allergens: "",
        status: "active",
      },
    });
  }

  await prisma.addonGroup.upsert({
    where: { id: "addon-extra-toppings" },
    update: {},
    create: {
      id: "addon-extra-toppings",
      name: "Extra Toppings",
      slug: "extra-toppings",
      selectionType: "multiple",
      isActive: true,
      isRequired: false,
      minSelect: 0,
      maxSelect: 5,
      freeChoicesCount: 0,
      order: 1,
      options: {
        create: [
          { name: "Extra Cheese", price: "1.00", order: 1 },
          { name: "Kebab-liha", price: "1.50", order: 2 },
          { name: "Kana", price: "1.50", order: 3 },
          { name: "Aurajuusto", price: "1.00", order: 4 },
          { name: "Jalopeno", price: "0.80", order: 5 },
        ],
      },
    },
  });

  await prisma.addonGroup.upsert({
    where: { id: "addon-sauce-choice" },
    update: {},
    create: {
      id: "addon-sauce-choice",
      name: "Sauce Choice",
      slug: "sauce-choice",
      selectionType: "single",
      isActive: true,
      isRequired: false,
      minSelect: 0,
      maxSelect: 1,
      freeChoicesCount: 1,
      order: 2,
      options: {
        create: [
          { name: "Garlic Sauce", price: "0.00", order: 1 },
          { name: "BBQ Sauce", price: "0.00", order: 2 },
          { name: "Mild Sauce", price: "0.00", order: 3 },
        ],
      },
    },
  });

  const addonLinks = [
  // Pizza items
  "item-margarita-pizza",
  "item-kinkku-pizza",
  "item-tropicana-pizza",
  "item-vegetariana-pizza",
  "item-opera-special-pizza",
  "item-romana-pizza",
  "item-kebabpizza",
  "item-fantasia",
  "item-romana-perhe",
  "item-kebab-perhe",

  // Kebab items
  "item-iskender-kebab",
  "item-pitakebab",
  "item-rullakebab",
  "item-kebab-ranskalaisilla",
  "item-kebab-riisilla",
];

for (const menuItemId of addonLinks) {
  await prisma.menuItemAddonGroup.upsert({
    where: {
      menuItemId_addonGroupId: {
        menuItemId,
        addonGroupId: "addon-extra-toppings",
      },
    },
    update: {},
    create: {
      menuItemId,
      addonGroupId: "addon-extra-toppings",
      order: 1,
    },
  });

  await prisma.menuItemAddonGroup.upsert({
    where: {
      menuItemId_addonGroupId: {
        menuItemId,
        addonGroupId: "addon-sauce-choice",
      },
    },
    update: {},
    create: {
      menuItemId,
      addonGroupId: "addon-sauce-choice",
      order: 2,
    },
  });
}
  await prisma.deliveryCoupon.upsert({
    where: { code: "SORRY530" },
    update: {},
    create: {
      code: "SORRY530",
      isActive: true,
      isPersonal: true,
      discountType: "fixed",
      discountValue: "5.30",
      minSubtotal: "0.00",
      maxUses: 1,
    },
  });

  await prisma.deliveryPromotion.upsert({
    where: { id: "promo-free-delivery" },
    update: {},
    create: {
      id: "promo-free-delivery",
      title: "Free Delivery",
      isActive: false,
      minSubtotal: "20.00",
      freeDelivery: true,
    },
  });

  await prisma.loyaltyProgram.upsert({
    where: { id: "loyalty-default" },
    update: {
      isActive: true,
      targetOrders: 10,
      rewardPercent: 30,
    },
    create: {
      id: "loyalty-default",
      isActive: true,
      targetOrders: 10,
      rewardPercent: 30,
    },
  });

  await prisma.deliveryPricing.upsert({
    where: { id: "delivery-pricing-default" },
    update: {
      isActive: true,
      baseKm: "2.00",
      baseFee: "1.99",
      perKmFee: "0.99",
      maxFee: "8.99",
    },
    create: {
      id: "delivery-pricing-default",
      isActive: true,
      baseKm: "2.00",
      baseFee: "1.99",
      perKmFee: "0.99",
      maxFee: "8.99",
    },
  });

  await prisma.heroBanner.upsert({
    where: { id: "hero-default" },
    update: {},
    create: {
      id: "hero-default",
      image: "/hero.png",
      isActive: true,
      order: 1,
    },
  });

  await prisma.review.upsert({
    where: { id: "review-demo-1" },
    update: {},
    create: {
      id: "review-demo-1",
      name: "Local Customer",
      rating: 5,
      comment: "Fresh food, friendly service and fast delivery.",
    },
  });

  console.log("Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });