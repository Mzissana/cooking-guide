import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FilterBar } from "./components/FilterBar";
import { IngredientItem } from "./components/IngredientItem";
import { RecipeCard } from "./components/RecipeCard";
import { RecipeDetails } from "./components/RecipeDetails";
import { RecipeForm } from "./components/RecipeForm";
import {
  ingredientCategories,
  ingredientStatuses,
  recipeCategories,
  statusLabels,
  seedFilters,
  seedIngredients,
  seedRecipes,
  seedSettings,
  seedShoppingState,
} from "./data/mockData";
import { useLocalStorage } from "./hooks/useLocalStorage";

function createId(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function getNextStatus(status) {
  const currentIndex = ingredientStatuses.indexOf(status);
  return ingredientStatuses[(currentIndex + 1) % ingredientStatuses.length];
}

function computeRecipe(recipe, ingredientMap) {
  if (!recipe.ingredients.length) {
    return {
      ...recipe,
      availableIngredients: 0,
      missingIngredientsCount: 0,
      availabilityStatus: "no_ingredients",
    };
  }

  const requiredIngredients = recipe.ingredients.filter(
    (item) => !item.optional,
  );
  const availableIngredients = requiredIngredients.filter((item) => {
    const ingredient = ingredientMap[item.ingredientId];
    return ingredient && ingredient.status !== "need_to_buy";
  }).length;
  const missingIngredientsCount =
    requiredIngredients.length - availableIngredients;

  let availabilityStatus = "missing_many";
  if (missingIngredientsCount === 0) {
    availabilityStatus = "can_cook";
  } else if (missingIngredientsCount <= 2) {
    availabilityStatus = "almost_ready";
  }

  return {
    ...recipe,
    availableIngredients,
    missingIngredientsCount,
    availabilityStatus,
  };
}

function dedupeIngredients(ingredients) {
  const seen = new Map();

  ingredients.forEach((ingredient) => {
    const key = ingredient.name.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, ingredient);
    }
  });

  return Array.from(seen.values());
}

export default function App() {
  const [recipes, setRecipes] = useLocalStorage(
    "kitchen-compass.recipes",
    seedRecipes,
  );
  const [ingredients, setIngredients] = useLocalStorage(
    "kitchen-compass.ingredients",
    seedIngredients,
  );
  const [settings, setSettings] = useLocalStorage(
    "kitchen-compass.settings",
    seedSettings,
  );
  const [filters, setFilters] = useLocalStorage(
    "kitchen-compass.filters",
    seedFilters,
  );
  const [ingredientCategoryList, setIngredientCategoryList] = useLocalStorage(
    "kitchen-compass.ingredientCategories",
    ingredientCategories,
  );
  const [shoppingState, setShoppingState] = useLocalStorage(
    "kitchen-compass.shopping",
    seedShoppingState,
  );
  const [stepChecks, setStepChecks] = useLocalStorage(
    "kitchen-compass.steps",
    {},
  );

  const [activePage, setActivePage] = useState("recipes");
  const [selectedRecipeId, setSelectedRecipeId] = useState(
    seedRecipes[0]?.id ?? null,
  );
  const [editingRecipeId, setEditingRecipeId] = useState(null);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [ingredientDraft, setIngredientDraft] = useState({
    id: null,
    name: "",
    category: "others",
    status: "enough",
  });
  const [manualShoppingDraft, setManualShoppingDraft] = useState({
    name: "",
    category: "others",
  });
  const [suggestedRecipeId, setSuggestedRecipeId] = useState(null);
  const [categoryModal, setCategoryModal] = useState({ open: false, name: "" });

  const ingredientNameInputRef = useRef(null);
  const ingredientFormPanelRef = useRef(null);
  const categoryNameInputRef = useRef(null);

  useEffect(() => {
    if (!categoryModal.open) {
      return;
    }

    document.body.classList.add("modal-open");
    requestAnimationFrame(() => categoryNameInputRef.current?.focus());

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setCategoryModal((current) => ({ ...current, open: false }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [categoryModal.open]);

  const ingredientCategoryOptions = useMemo(() => {
    const next = [];
    const seen = new Set();
    [
      ...ingredientCategories,
      ...ingredientCategoryList,
      ...ingredients.map((ingredient) => ingredient.category),
      ...shoppingState.manualItems.map((item) => item.category),
      ...shoppingState.recipeItems.map((item) => item.category),
    ].forEach((category) => {
      const normalized = String(category ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
      if (!normalized) {
        return;
      }
      if (seen.has(normalized)) {
        return;
      }
      seen.add(normalized);
      next.push(normalized);
    });
    return next;
  }, [
    ingredientCategoryList,
    ingredients,
    shoppingState.manualItems,
    shoppingState.recipeItems,
  ]);

  const ingredientMap = useMemo(
    () =>
      Object.fromEntries(
        ingredients.map((ingredient) => [ingredient.id, ingredient]),
      ),
    [ingredients],
  );

  const enrichedRecipes = useMemo(
    () => recipes.map((recipe) => computeRecipe(recipe, ingredientMap)),
    [ingredientMap, recipes],
  );

  const selectedRecipe =
    enrichedRecipes.find((recipe) => recipe.id === selectedRecipeId) ?? null;
  const editingRecipe =
    recipes.find((recipe) => recipe.id === editingRecipeId) ?? null;

  const pageTitle = (() => {
    if (activePage === "recipes") {
      return "Recipes";
    }

    if (activePage === "ingredients") {
      return "Ingredients";
    }

    if (activePage === "shopping") {
      return "Shopping list";
    }

    if (activePage === "editor") {
      return editingRecipe ? "Edit recipe" : "New recipe";
    }

    if (activePage === "details") {
      return "Recipe";
    }

    return "Kitchen";
  })();

  const filteredRecipes = useMemo(() => {
    const visibleCategories = settings.visibleRecipeCategories;

    const nextRecipes = enrichedRecipes
      .filter((recipe) => visibleCategories[recipe.category])
      .filter((recipe) =>
        recipeSearch.trim()
          ? recipe.name
              .toLowerCase()
              .includes(recipeSearch.trim().toLowerCase())
          : true,
      )
      .filter((recipe) =>
        filters.onlyCookable ? recipe.availabilityStatus === "can_cook" : true,
      )
      .filter((recipe) => (filters.lowEnergyOnly ? recipe.time <= 20 : true))
      .filter((recipe) => (filters.favoritesOnly ? recipe.favorite : true))
      .sort((left, right) => {
        if (filters.sortBy === "time") {
          return left.time - right.time;
        }

        if (filters.sortBy === "name") {
          return left.name.localeCompare(right.name);
        }

        return (
          left.missingIngredientsCount - right.missingIngredientsCount ||
          left.time - right.time
        );
      });

    return nextRecipes;
  }, [
    enrichedRecipes,
    filters,
    recipeSearch,
    settings.visibleRecipeCategories,
  ]);

  const shoppingItems = useMemo(() => {
    const inventoryItems = ingredients
      .filter((ingredient) => ingredient.status === "need_to_buy")
      .map((ingredient) => ({
        key: `ingredient:${ingredient.id}`,
        label: ingredient.name,
        category: ingredient.category,
        removable: false,
      }));

    const recipeItems = shoppingState.recipeItems.map((item) => ({
      key: `ingredient:${item.ingredientId}`,
      label: item.name,
      category: item.category,
      removable: true,
    }));

    const manualItems = shoppingState.manualItems.map((item) => ({
      key: `manual:${item.id}`,
      label: item.name,
      category: item.category,
      removable: true,
    }));

    const itemMap = new Map();
    [...inventoryItems, ...recipeItems, ...manualItems].forEach((item) => {
      if (!itemMap.has(item.key)) {
        itemMap.set(item.key, item);
      }
    });

    return Array.from(itemMap.values());
  }, [ingredients, shoppingState.manualItems, shoppingState.recipeItems]);

  const shoppingByCategory = useMemo(
    () =>
      ingredientCategoryOptions.reduce((accumulator, category) => {
        accumulator[category] = shoppingItems.filter(
          (item) => item.category === category,
        );
        return accumulator;
      }, {}),
    [ingredientCategoryOptions, shoppingItems],
  );

  const handleOpenRecipe = (recipeId) => {
    setSelectedRecipeId(recipeId);
    setActivePage("details");
  };

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const handleSelectRecipeCategory = (category) => {
    setSettings((current) => {
      const nextVisibility = { ...current.visibleRecipeCategories };

      if (category === "all") {
        recipeCategories.forEach((item) => {
          nextVisibility[item] = true;
        });
      } else {
        recipeCategories.forEach((item) => {
          nextVisibility[item] = item === category;
        });
      }

      return {
        ...current,
        visibleRecipeCategories: nextVisibility,
      };
    });
  };

  const handleToggleSimpleMode = () => {
    setSettings((current) => ({ ...current, simpleMode: !current.simpleMode }));
  };

  const handleToggleFavorite = (recipeId) => {
    setRecipes((current) =>
      current.map((recipe) =>
        recipe.id === recipeId
          ? { ...recipe, favorite: !recipe.favorite }
          : recipe,
      ),
    );
  };

  const handleSuggestRecipe = () => {
    const candidates = (
      filteredRecipes.length ? filteredRecipes : enrichedRecipes
    ).filter((recipe) => recipe.availabilityStatus !== "no_ingredients");
    if (!candidates.length) {
      return;
    }

    const statusPriority = {
      can_cook: 0,
      almost_ready: 1,
      missing_many: 2,
      no_ingredients: 3,
    };

    const sortedCandidates = [...candidates].sort((left, right) => {
      return (
        (statusPriority[left.availabilityStatus] ?? 99) -
          (statusPriority[right.availabilityStatus] ?? 99) ||
        left.missingIngredientsCount - right.missingIngredientsCount ||
        left.time - right.time
      );
    });

    const topPicks = sortedCandidates.slice(
      0,
      Math.min(3, sortedCandidates.length),
    );
    let pick = topPicks[Math.floor(Math.random() * topPicks.length)];
    if (
      suggestedRecipeId &&
      topPicks.length > 1 &&
      pick.id === suggestedRecipeId
    ) {
      pick =
        topPicks.find((candidate) => candidate.id !== suggestedRecipeId) ??
        pick;
    }

    setSuggestedRecipeId(pick.id);
    handleOpenRecipe(pick.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleStep = (recipeId, stepIndex) => {
    setStepChecks((current) => {
      const recipeSteps = current[recipeId] ? [...current[recipeId]] : [];
      recipeSteps[stepIndex] = !recipeSteps[stepIndex];
      return {
        ...current,
        [recipeId]: recipeSteps,
      };
    });
  };

  const handleDeleteRecipe = (recipeId) => {
    setRecipes((current) => current.filter((recipe) => recipe.id !== recipeId));
    setShoppingState((current) => ({
      ...current,
      recipeItems: current.recipeItems.filter(
        (item) => item.recipeId !== recipeId,
      ),
    }));
    if (selectedRecipeId === recipeId) {
      const fallbackRecipe = enrichedRecipes.find(
        (recipe) => recipe.id !== recipeId,
      );
      setSelectedRecipeId(fallbackRecipe?.id ?? null);
      setActivePage("recipes");
    }
  };

  const handleSaveRecipe = ({ recipe }) => {
    const nextIngredients = [...ingredients];
    const nextRecipeIngredients = recipe.ingredients.map((item) => {
      if (!item.newName) {
        return {
          ingredientId: item.ingredientId,
          amount: item.amount,
          optional: item.optional,
        };
      }

      const existingIngredient = nextIngredients.find(
        (ingredient) =>
          ingredient.name.trim().toLowerCase() === item.newName.toLowerCase(),
      );

      if (existingIngredient) {
        return {
          ingredientId: existingIngredient.id,
          amount: item.amount,
          optional: item.optional,
        };
      }

      const newIngredient = {
        id: createId("ingredient"),
        name: item.newName,
        category: item.newCategory,
        status: "need_to_buy",
      };

      nextIngredients.push(newIngredient);

      return {
        ingredientId: newIngredient.id,
        amount: item.amount,
        optional: item.optional,
      };
    });

    const nextRecipe = {
      ...recipe,
      id: recipe.id ?? createId("recipe"),
      ingredients: nextRecipeIngredients,
      steps: recipe.steps.length ? recipe.steps : ["Prep and cook."],
    };

    setIngredients(dedupeIngredients(nextIngredients));
    setRecipes((current) => {
      const exists = current.some((item) => item.id === nextRecipe.id);
      if (!exists) {
        return [nextRecipe, ...current];
      }

      return current.map((item) =>
        item.id === nextRecipe.id ? nextRecipe : item,
      );
    });
    setEditingRecipeId(null);
    setSelectedRecipeId(nextRecipe.id);
    setActivePage("details");
  };

  const handleCreateIngredient = ({ name, category }) => {
    return new Promise((resolve) => {
      const trimmedName = name.trim();
      if (!trimmedName) {
        resolve("");
        return;
      }

      const normalized = trimmedName.toLowerCase();

      setIngredients((current) => {
        const existing = current.find(
          (ingredient) => ingredient.name.trim().toLowerCase() === normalized,
        );
        if (existing) {
          resolve(existing.id);
          return current;
        }

        const newIngredient = {
          id: createId("ingredient"),
          name: trimmedName,
          category,
          status: "need_to_buy",
        };

        resolve(newIngredient.id);
        return [...current, newIngredient];
      });
    });
  };

  const handleAddMissingToShopping = (recipeId) => {
    const recipe = enrichedRecipes.find((item) => item.id === recipeId);
    if (!recipe) {
      return;
    }

    const missingItems = recipe.ingredients
      .filter((item) => !item.optional)
      .map((item) => ingredientMap[item.ingredientId])
      .filter(
        (ingredient) => ingredient && ingredient.status === "need_to_buy",
      );

    setShoppingState((current) => {
      const existingKeys = new Set(
        current.recipeItems.map((item) => item.ingredientId),
      );
      const extraItems = missingItems
        .filter((ingredient) => !existingKeys.has(ingredient.id))
        .map((ingredient) => ({
          ingredientId: ingredient.id,
          name: ingredient.name,
          category: ingredient.category,
          recipeId,
        }));

      return {
        ...current,
        recipeItems: [...current.recipeItems, ...extraItems],
      };
    });
    setActivePage("shopping");
  };

  const handleCycleIngredientStatus = (ingredientId) => {
    setIngredients((current) =>
      current.map((ingredient) =>
        ingredient.id === ingredientId
          ? { ...ingredient, status: getNextStatus(ingredient.status) }
          : ingredient,
      ),
    );
  };

  const handleSaveIngredient = (event) => {
    event.preventDefault();

    const nextIngredient = {
      id: ingredientDraft.id ?? createId("ingredient"),
      name: ingredientDraft.name.trim(),
      category: ingredientDraft.category,
      status: ingredientDraft.status,
    };

    if (!nextIngredient.name) {
      return;
    }

    setIngredients((current) => {
      if (ingredientDraft.id) {
        return current.map((ingredient) =>
          ingredient.id === nextIngredient.id ? nextIngredient : ingredient,
        );
      }

      return [...current, nextIngredient];
    });

    setIngredientDraft({
      id: null,
      name: "",
      category: ingredientDraft.category,
      status: ingredientDraft.status,
    });
  };

  const handleDeleteIngredient = (ingredientId) => {
    setIngredients((current) =>
      current.filter((ingredient) => ingredient.id !== ingredientId),
    );
    setShoppingState((current) => ({
      ...current,
      checked: Object.fromEntries(
        Object.entries(current.checked).filter(
          ([key]) => key !== `ingredient:${ingredientId}`,
        ),
      ),
      recipeItems: current.recipeItems.filter(
        (item) => item.ingredientId !== ingredientId,
      ),
    }));
    if (ingredientDraft.id === ingredientId) {
      setIngredientDraft({
        id: null,
        name: "",
        category: "others",
        status: "enough",
      });
    }
  };

  const handleEditIngredient = (ingredientId) => {
    const ingredient = ingredients.find((item) => item.id === ingredientId);
    if (!ingredient) {
      return;
    }

    setIngredientDraft(ingredient);

    requestAnimationFrame(() => {
      ingredientFormPanelRef.current?.scrollIntoView({
        block: "start",
        behavior: "smooth",
      });
      ingredientNameInputRef.current?.focus();
    });
  };

  const handleAddIngredientForCategory = (category) => {
    setIngredientDraft({
      id: null,
      name: "",
      category,
      status: "enough",
    });

    requestAnimationFrame(() => {
      ingredientFormPanelRef.current?.scrollIntoView({
        block: "start",
        behavior: "smooth",
      });
      ingredientNameInputRef.current?.focus();
    });
  };

  const openNewCategoryModal = () => {
    setCategoryModal({ open: true, name: "" });
  };

  const handleSaveCategory = (event) => {
    event.preventDefault();
    const normalized = categoryModal.name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
    if (!normalized) {
      return;
    }

    setIngredientCategoryList((current) => {
      const existing = new Set(
        current.map((item) =>
          String(item ?? "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " "),
        ),
      );
      if (existing.has(normalized)) {
        return current;
      }
      return [...current, normalized];
    });
    setCategoryModal({ open: false, name: "" });
  };

  const handleToggleShoppingItem = (itemKey) => {
    setShoppingState((current) => ({
      ...current,
      checked: {
        ...current.checked,
        [itemKey]: !current.checked[itemKey],
      },
    }));
  };

  const handleAddManualShoppingItem = (event) => {
    event.preventDefault();

    if (!manualShoppingDraft.name.trim()) {
      return;
    }

    setShoppingState((current) => ({
      ...current,
      manualItems: [
        ...current.manualItems,
        {
          id: createId("manual"),
          name: manualShoppingDraft.name.trim(),
          category: manualShoppingDraft.category,
        },
      ],
    }));
    setManualShoppingDraft({
      name: "",
      category: manualShoppingDraft.category,
    });
  };

  const handleRemoveShoppingItem = (itemKey) => {
    setShoppingState((current) => {
      const nextChecked = { ...current.checked };
      delete nextChecked[itemKey];

      if (itemKey.startsWith("manual:")) {
        const id = itemKey.replace("manual:", "");
        return {
          ...current,
          checked: nextChecked,
          manualItems: current.manualItems.filter((item) => item.id !== id),
        };
      }

      const ingredientId = itemKey.replace("ingredient:", "");
      return {
        ...current,
        checked: nextChecked,
        recipeItems: current.recipeItems.filter(
          (item) => item.ingredientId !== ingredientId,
        ),
      };
    });
  };

  const handleClearNeedToBuyIngredient = (itemKey) => {
    const ingredientId = itemKey.replace("ingredient:", "");

    setIngredients((current) =>
      current.map((ingredient) =>
        ingredient.id === ingredientId
          ? { ...ingredient, status: "enough" }
          : ingredient,
      ),
    );

    setShoppingState((current) => {
      const nextChecked = { ...current.checked };
      delete nextChecked[itemKey];

      return {
        ...current,
        checked: nextChecked,
        recipeItems: current.recipeItems.filter(
          (item) => item.ingredientId !== ingredientId,
        ),
      };
    });
  };

  return (
    <div
      className={`app-shell page-${activePage} ${settings.simpleMode ? "simple-mode" : ""}`}>
      <header className="page-header">
        <h1 className="page-header-title">{pageTitle}</h1>
        {activePage === "recipes" ? (
          <div className="search-field" role="search">
            <span className="search-icon" aria-hidden="true">
              <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M8.8 14.6a5.8 5.8 0 1 1 0-11.6 5.8 5.8 0 0 1 0 11.6Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M13.4 13.4 17 17"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <input
              type="search"
              value={recipeSearch}
              onChange={(event) => setRecipeSearch(event.target.value)}
              placeholder="Search recipes"
              aria-label="Search recipes"
            />
          </div>
        ) : null}
      </header>

      <nav className="nav-tabs">
        {[
          { id: "recipes", label: "Recipes" },
          { id: "ingredients", label: "Ingredients" },
          { id: "shopping", label: "Shopping list" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            className={activePage === item.id ? "active" : ""}
            onClick={() => setActivePage(item.id)}>
            {item.label}
          </button>
        ))}

        <button
          type="button"
          className="primary-button nav-cta"
          onClick={() => {
            setEditingRecipeId(null);
            setActivePage("editor");
          }}>
          New recipe
        </button>
      </nav>

      {activePage === "recipes" ? (
        <>
          <FilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            settings={settings}
            onSelectCategory={handleSelectRecipeCategory}
            onToggleSimpleMode={handleToggleSimpleMode}
            onSuggestRecipe={handleSuggestRecipe}
          />

          {suggestedRecipeId ? (
            <section className="panel suggestion-banner">
              <div>
                <p className="eyebrow">Cook today</p>
                <strong>
                  {
                    enrichedRecipes.find(
                      (recipe) => recipe.id === suggestedRecipeId,
                    )?.name
                  }
                </strong>
              </div>
              <button
                type="button"
                className="ghost-button"
                onClick={() => handleOpenRecipe(suggestedRecipeId)}>
                Open
              </button>
            </section>
          ) : null}

          {filteredRecipes.length ? (
            <div className="recipe-list">
              {filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onOpen={handleOpenRecipe}
                  onToggleFavorite={handleToggleFavorite}
                  simpleMode={settings.simpleMode}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state panel">
              No recipes match these filters.
            </div>
          )}
        </>
      ) : null}

      {activePage === "details" && selectedRecipe ? (
        <RecipeDetails
          recipe={selectedRecipe}
          ingredientMap={ingredientMap}
          stepChecks={stepChecks[selectedRecipe.id] ?? []}
          onToggleStep={handleToggleStep}
          onBack={() => setActivePage("recipes")}
          onEdit={() => {
            setEditingRecipeId(selectedRecipe.id);
            setActivePage("editor");
          }}
          onDelete={() => handleDeleteRecipe(selectedRecipe.id)}
          onAddMissingToShopping={handleAddMissingToShopping}
          onCycleIngredientStatus={handleCycleIngredientStatus}
        />
      ) : null}

      {activePage === "editor" ? (
        <RecipeForm
          recipe={editingRecipe}
          ingredients={ingredients}
          ingredientCategories={ingredientCategoryOptions}
          onSubmit={handleSaveRecipe}
          onCreateIngredient={handleCreateIngredient}
          onCancel={() => {
            setEditingRecipeId(null);
            setActivePage(selectedRecipeId ? "details" : "recipes");
          }}
        />
      ) : null}

      {activePage === "ingredients" ? (
        <div className="page-grid">
          <section className="panel">
            <div className="section-heading">
              <h2>Inventory</h2>
              <div className="inline-icon">
                <button
                  type="button"
                  className="ghost-button compact"
                  onClick={openNewCategoryModal}>
                  New category
                </button>
              </div>
            </div>

            <div className="inventory-groups">
              {ingredientCategoryOptions.map((category) => {
                const items = ingredients.filter(
                  (ingredient) => ingredient.category === category,
                );
                return (
                  <details key={category} className="inventory-group">
                    <summary className="inventory-summary">
                      <div className="inventory-summary-title">
                        <h3>{category}</h3>
                        <span className="muted">{items.length}</span>
                      </div>
                      <div className="inventory-summary-actions">
                        <button
                          type="button"
                          className="ghost-button compact"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handleAddIngredientForCategory(category);
                          }}>
                          Add
                        </button>
                        <span className="inventory-toggle" aria-hidden="true">
                          ›
                        </span>
                      </div>
                    </summary>
                    <div className="stack-list">
                      {items.map((ingredient) => (
                        <IngredientItem
                          key={ingredient.id}
                          ingredient={ingredient}
                          onCycleStatus={handleCycleIngredientStatus}
                          onEdit={handleEditIngredient}
                          onDelete={handleDeleteIngredient}
                        />
                      ))}
                      {!items.length ? (
                        <p className="muted">Nothing here.</p>
                      ) : null}
                    </div>
                  </details>
                );
              })}
            </div>
          </section>

          <section ref={ingredientFormPanelRef} className="panel">
            <div className="section-heading">
              <h2>
                {ingredientDraft.id ? "Edit ingredient" : "Add ingredient"}
              </h2>
            </div>

            <form className="recipe-form" onSubmit={handleSaveIngredient}>
              <label>
                <span>Name</span>
                <input
                  ref={ingredientNameInputRef}
                  type="text"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={ingredientDraft.name}
                  onChange={(event) =>
                    setIngredientDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Bell peppers"
                  required
                />
              </label>

              <label>
                <span>Category</span>
                <select
                  value={ingredientDraft.category}
                  onChange={(event) =>
                    setIngredientDraft((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }>
                  {ingredientCategoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Status</span>
                <select
                  value={ingredientDraft.status}
                  onChange={(event) =>
                    setIngredientDraft((current) => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }>
                  {ingredientStatuses.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status] ?? status}
                    </option>
                  ))}
                </select>
              </label>

              <div className="form-actions">
                <button type="submit" className="primary-button">
                  {ingredientDraft.id ? "Save changes" : "Add ingredient"}
                </button>
                {ingredientDraft.id ? (
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() =>
                      setIngredientDraft({
                        id: null,
                        name: "",
                        category: "others",
                        status: "enough",
                      })
                    }>
                    Cancel edit
                  </button>
                ) : null}
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {activePage === "shopping" ? (
        <div className="page-grid">
          <section className="panel">
            <div className="section-heading">
              <h2>Shopping list</h2>
              <span className="muted">{shoppingItems.length} items</span>
            </div>

            <div className="inventory-groups">
              {ingredientCategoryOptions.map((category) => (
                <details key={category} className="inventory-group">
                  <summary className="inventory-summary">
                    <div className="inventory-summary-title">
                      <h3>{category}</h3>
                      <span className="muted">
                        {shoppingByCategory[category].length}
                      </span>
                    </div>
                    <div className="inventory-summary-actions">
                      <span className="inventory-toggle" aria-hidden="true">
                        ›
                      </span>
                    </div>
                  </summary>
                  <div className="stack-list">
                    {shoppingByCategory[category].map((item) => (
                      <label
                        key={item.key}
                        className={`shopping-item ${shoppingState.checked[item.key] ? "done" : ""}`}>
                        <input
                          type="checkbox"
                          checked={Boolean(shoppingState.checked[item.key])}
                          onChange={() => handleToggleShoppingItem(item.key)}
                        />
                        <span>{item.label}</span>
                        <button
                          type="button"
                          className="remove-icon-button"
                          aria-label={
                            item.removable ? "Remove item" : "Mark as bought"
                          }
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            if (item.removable) {
                              handleRemoveShoppingItem(item.key);
                              return;
                            }

                            handleClearNeedToBuyIngredient(item.key);
                          }}>
                          −
                        </button>
                      </label>
                    ))}

                    {!shoppingByCategory[category].length ? (
                      <p className="muted">Nothing here.</p>
                    ) : null}
                  </div>
                </details>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="section-heading">
              <h2>Manual item</h2>
            </div>

            <form
              className="recipe-form"
              onSubmit={handleAddManualShoppingItem}>
              <label>
                <span>Name</span>
                <input
                  type="text"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={manualShoppingDraft.name}
                  onChange={(event) =>
                    setManualShoppingDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Lemons"
                  required
                />
              </label>

              <label>
                <span>Category</span>
                <select
                  value={manualShoppingDraft.category}
                  onChange={(event) =>
                    setManualShoppingDraft((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }>
                  {ingredientCategoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <button type="submit" className="primary-button">
                Add to list
              </button>
            </form>
          </section>
        </div>
      ) : null}

      {categoryModal.open
        ? createPortal(
            <div
              className="modal-backdrop"
              role="presentation"
              onClick={() =>
                setCategoryModal((current) => ({ ...current, open: false }))
              }>
              <div
                className="panel modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="category-modal-title"
                onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                  <h3 id="category-modal-title">New category</h3>
                  <button
                    type="button"
                    className="ghost-button compact"
                    onClick={() =>
                      setCategoryModal((current) => ({
                        ...current,
                        open: false,
                      }))
                    }>
                    Close
                  </button>
                </div>

                <form className="recipe-form" onSubmit={handleSaveCategory}>
                  <label>
                    <span>Name</span>
                    <input
                      ref={categoryNameInputRef}
                      type="text"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      value={categoryModal.name}
                      onChange={(event) =>
                        setCategoryModal((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="sauces"
                      required
                    />
                  </label>

                  <div className="modal-actions">
                    <button type="submit" className="primary-button">
                      Save
                    </button>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() =>
                        setCategoryModal((current) => ({
                          ...current,
                          open: false,
                        }))
                      }>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
