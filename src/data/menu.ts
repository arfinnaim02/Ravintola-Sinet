import { MenuItem } from "../contexts/CartContext";

/**
 * Sample categories for the restaurant menu. In a real application these would
 * likely come from a database or a headless CMS. Each category has an
 * identifier and a human readable name.
 */
export const categories: { id: string; name: string }[] = [
  { id: "pizza", name: "Pizzas" },
  { id: "salad", name: "Salads" },
  { id: "pasta", name: "Pastas" },
  { id: "drink", name: "Drinks" },
];

/**
 * A mock list of menu items. Each item references its category by ID. The
 * `image` field can be a path to a file in the `public` folder or left empty
 * to use a default placeholder. Prices are in euros.
 */
export const menuItems: MenuItem[] = [
  {
    id: "pizza-margherita",
    name: "Margherita",
    description: "Classic pizza with tomato sauce, mozzarella, and basil.",
    price: 10.5,
    category: "pizza",
    image: "",
  },
  {
    id: "pizza-vegetarian",
    name: "Vegetarian",
    description: "Tomato sauce, mozzarella, bell peppers, mushrooms, olives.",
    price: 11.9,
    category: "pizza",
    image: "",
  },
  {
    id: "pizza-pepperoni",
    name: "Pepperoni",
    description: "Tomato sauce, mozzarella, spicy pepperoni slices.",
    price: 12.5,
    category: "pizza",
    image: "",
  },
  {
    id: "salad-caesar",
    name: "Caesar Salad",
    description: "Romaine lettuce, parmesan, croutons, Caesar dressing.",
    price: 8.5,
    category: "salad",
    image: "",
  },
  {
    id: "pasta-carbonara",
    name: "Pasta Carbonara",
    description: "Creamy sauce with bacon, parmesan and black pepper.",
    price: 13.0,
    category: "pasta",
    image: "",
  },
  {
    id: "drink-cola",
    name: "Cola",
    description: "Chilled cola (33cl)",
    price: 3.0,
    category: "drink",
    image: "",
  },
  {
    id: "drink-water",
    name: "Still Water",
    description: "Pure still water (50cl)",
    price: 2.5,
    category: "drink",
    image: "",
  },
];