export const ingredientCategories = ["proteins", "vegetables", "carbs", "others"];
export const recipeCategories = ["breakfast", "lunch", "dinner"];
export const ingredientStatuses = ["a_lot", "enough", "need_to_buy"];

export const statusLabels = {
  a_lot: "A lot",
  enough: "Enough",
  need_to_buy: "Need to buy",
};

export const recipeStatusLabels = {
  can_cook: "Can cook",
  almost_ready: "Almost ready",
  missing_many: "Missing many",
  no_ingredients: "No ingredients",
};

export const seedIngredients = [
  { id: "eggs", name: "Eggs", category: "proteins", status: "a_lot" },
  { id: "spinach", name: "Spinach", category: "vegetables", status: "enough" },
  { id: "milk", name: "Milk", category: "others", status: "enough" },
  { id: "oats", name: "Oats", category: "carbs", status: "enough" },
  { id: "chicken", name: "Chicken breast", category: "proteins", status: "need_to_buy" },
  { id: "rice", name: "Rice", category: "carbs", status: "enough" },
  { id: "tomatoes", name: "Tomatoes", category: "vegetables", status: "a_lot" },
  { id: "pasta", name: "Pasta", category: "carbs", status: "need_to_buy" },
  { id: "garlic", name: "Garlic", category: "vegetables", status: "enough" },
  { id: "olive-oil", name: "Olive oil", category: "others", status: "a_lot" },
  { id: "yogurt", name: "Greek yogurt", category: "proteins", status: "enough" },
  { id: "berries", name: "Berries", category: "vegetables", status: "need_to_buy" },
];

export const seedRecipes = [
  {
    id: "omelette-bowl",
    name: "Spinach Omelette Bowl",
    category: "breakfast",
    image:
      "https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=900&q=80",
    time: 12,
    ingredients: [
      { ingredientId: "eggs", amount: "2", optional: false },
      { ingredientId: "spinach", amount: "1 handful", optional: false },
      { ingredientId: "milk", amount: "1 splash", optional: true },
      { ingredientId: "olive-oil", amount: "1 tsp", optional: true },
    ],
    steps: [
      "Beat the eggs with a splash of milk.",
      "Warm a pan and wilt the spinach for 30 seconds.",
      "Pour in the eggs and cook until softly set.",
      "Fold and serve in a bowl.",
    ],
    videoUrl: "https://www.youtube.com/watch?v=4kD5vMsaLrE",
    notes: "Great for low-energy mornings.",
    favorite: true,
  },
  {
    id: "overnight-oats",
    name: "Berry Overnight Oats",
    category: "breakfast",
    image:
      "https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=900&q=80",
    time: 5,
    ingredients: [
      { ingredientId: "oats", amount: "1/2 cup", optional: false },
      { ingredientId: "milk", amount: "3/4 cup", optional: false },
      { ingredientId: "berries", amount: "1/3 cup", optional: false },
      { ingredientId: "yogurt", amount: "2 tbsp", optional: true },
    ],
    steps: [
      "Stir oats, milk, and yogurt in a jar.",
      "Top with berries.",
      "Rest in the fridge overnight.",
    ],
    notes: "Prep once, breakfast twice.",
    favorite: false,
  },
  {
    id: "chicken-rice",
    name: "Chicken Rice Plate",
    category: "lunch",
    image:
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80",
    time: 25,
    ingredients: [
      { ingredientId: "chicken", amount: "200 g", optional: false },
      { ingredientId: "rice", amount: "1 cup cooked", optional: false },
      { ingredientId: "tomatoes", amount: "1", optional: true },
      { ingredientId: "garlic", amount: "1 clove", optional: true },
    ],
    steps: [
      "Season and cook the chicken until golden.",
      "Warm the rice.",
      "Slice tomatoes and serve together.",
    ],
    notes: "Swap rice for salad if you want something lighter.",
    favorite: false,
  },
  {
    id: "tomato-pasta",
    name: "Tomato Garlic Pasta",
    category: "dinner",
    image:
      "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=900&q=80",
    time: 18,
    ingredients: [
      { ingredientId: "pasta", amount: "120 g", optional: false },
      { ingredientId: "tomatoes", amount: "2", optional: false },
      { ingredientId: "garlic", amount: "2 cloves", optional: false },
      { ingredientId: "olive-oil", amount: "1 tbsp", optional: true },
    ],
    steps: [
      "Boil the pasta until tender.",
      "Cook garlic in olive oil for 30 seconds.",
      "Add chopped tomatoes and simmer briefly.",
      "Toss with pasta and serve.",
    ],
    videoUrl: "https://www.youtube.com/watch?v=M4xYx0A4n4Q",
    favorite: true,
  },
];

export const seedSettings = {
  simpleMode: false,
  visibleRecipeCategories: {
    breakfast: true,
    lunch: true,
    dinner: true,
  },
};

export const seedFilters = {
  onlyCookable: false,
  lowEnergyOnly: false,
  favoritesOnly: false,
  sortBy: "missing",
};

export const seedShoppingState = {
  manualItems: [
    { id: "manual-salt", name: "Sea salt", category: "others" },
  ],
  recipeItems: [],
  checked: {},
};
