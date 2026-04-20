import { useEffect, useMemo, useState } from "react";
import {
  ingredientCategories as defaultIngredientCategories,
  recipeCategories,
} from "../data/mockData";

const EMPTY_INGREDIENT = {
  ingredientId: "",
  amount: "",
  optional: false,
  createNew: false,
  newName: "",
  newCategory: "others",
};

function getInitialState(recipe) {
  return {
    name: recipe?.name ?? "",
    category: recipe?.category ?? "breakfast",
    image: recipe?.image ?? "",
    time: recipe?.time ?? 15,
    ingredients: recipe?.ingredients.map((item) => ({
      ingredientId: item.ingredientId,
      amount: item.amount,
      optional: item.optional,
      createNew: false,
      newName: "",
      newCategory: "others",
    })) ?? [{ ...EMPTY_INGREDIENT }],
    steps: recipe?.steps.length ? [...recipe.steps] : [""],
    videoUrl: recipe?.videoUrl ?? "",
    notes: recipe?.notes ?? "",
    favorite: recipe?.favorite ?? false,
  };
}

export function RecipeForm({
  recipe,
  ingredients,
  ingredientCategories,
  onSubmit,
  onCancel,
}) {
  const [formState, setFormState] = useState(() => getInitialState(recipe));
  const ingredientCategoryOptions = ingredientCategories?.length
    ? ingredientCategories
    : defaultIngredientCategories;
  const ingredientOptions = useMemo(
    () =>
      [...ingredients].sort((left, right) =>
        left.name.localeCompare(right.name),
      ),
    [ingredients],
  );

  useEffect(() => {
    setFormState(getInitialState(recipe));
  }, [recipe]);

  const updateField = (field, value) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const updateIngredientRow = (index, field, value) => {
    setFormState((current) => ({
      ...current,
      ingredients: current.ingredients.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const addIngredientRow = () => {
    setFormState((current) => ({
      ...current,
      ingredients: [...current.ingredients, { ...EMPTY_INGREDIENT }],
    }));
  };

  const removeIngredientRow = (index) => {
    setFormState((current) => ({
      ...current,
      ingredients: current.ingredients.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    }));
  };

  const addStep = () => {
    setFormState((current) => ({ ...current, steps: [...current.steps, ""] }));
  };

  const updateStep = (index, value) => {
    setFormState((current) => ({
      ...current,
      steps: current.steps.map((step, stepIndex) =>
        stepIndex === index ? value : step,
      ),
    }));
  };

  const removeStep = (index) => {
    setFormState((current) => ({
      ...current,
      steps: current.steps.filter((_, stepIndex) => stepIndex !== index),
    }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateField("image", reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const cleanedIngredients = formState.ingredients
      .map((item) => ({
        ...item,
        ingredientId: item.createNew ? "__new__" : item.ingredientId,
        amount: item.amount.trim(),
        newName: item.newName.trim(),
      }))
      .filter((item) => item.ingredientId || item.newName);

    const cleanedSteps = formState.steps
      .map((step) => step.trim())
      .filter(Boolean);

    onSubmit({
      recipe: {
        ...recipe,
        name: formState.name.trim(),
        category: formState.category,
        image: formState.image.trim(),
        time: Number(formState.time) || 0,
        ingredients: cleanedIngredients,
        steps: cleanedSteps,
        videoUrl: formState.videoUrl.trim(),
        notes: formState.notes.trim(),
        favorite: formState.favorite,
      },
    });
  };

  return (
    <section className="panel form-shell">
      <div className="section-heading">
        <h2>{recipe ? "Edit recipe" : "Create recipe"}</h2>
        <button type="button" className="ghost-button" onClick={onCancel}>
          Close
        </button>
      </div>

      <form className="recipe-form" onSubmit={handleSubmit} autoComplete="off">
        <div className="form-grid">
          <label>
            <span>Name</span>
            <input
              type="text"
              name="recipe-name"
              inputMode="text"
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              value={formState.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Creamy tomato pasta"
              required
            />
          </label>

          <label>
            <span>Category</span>
            <select
              value={formState.category}
              onChange={(event) => updateField("category", event.target.value)}>
              {recipeCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Cooking time (min)</span>
            <input
              type="number"
              min="0"
              value={formState.time}
              onChange={(event) => updateField("time", event.target.value)}
            />
          </label>

          <label>
            <span>Video URL</span>
            <input
              type="url"
              value={formState.videoUrl}
              onChange={(event) => updateField("videoUrl", event.target.value)}
              placeholder="https://"
            />
          </label>
        </div>

        <div className="form-grid single-column">
          <label>
            <span>Image URL</span>
            <input
              type="url"
              value={formState.image}
              onChange={(event) => updateField("image", event.target.value)}
              placeholder="https://images..."
            />
          </label>

          <label>
            <span>Or upload image</span>
            <input type="file" accept="image/*" onChange={handleImageUpload} />
          </label>
        </div>

        <label>
          <span>Notes</span>
          <textarea
            rows="3"
            value={formState.notes}
            onChange={(event) => updateField("notes", event.target.value)}
            placeholder="Optional reminder or serving note"
          />
        </label>

        <button
          type="button"
          className={`toggle-pill ${formState.favorite ? "active" : ""}`}
          aria-pressed={formState.favorite}
          onClick={() => updateField("favorite", !formState.favorite)}>
          Favorite
        </button>

        <div className="form-section">
          <div className="section-heading">
            <h3>Ingredients</h3>
            <button
              type="button"
              className="ghost-button"
              onClick={addIngredientRow}>
              Add ingredient
            </button>
          </div>

          <div className="stack-list">
            {formState.ingredients.map((item, index) => (
              <div
                key={`ingredient-row-${index}`}
                className="ingredient-editor">
                <div className="ingredient-editor-grid">
                  <label>
                    <span>Ingredient</span>
                    <select
                      value={item.createNew ? "__new__" : item.ingredientId}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        updateIngredientRow(
                          index,
                          "createNew",
                          nextValue === "__new__",
                        );
                        updateIngredientRow(
                          index,
                          "ingredientId",
                          nextValue === "__new__" ? "" : nextValue,
                        );
                      }}>
                      <option value="">Select ingredient</option>
                      {ingredientOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                      <option value="__new__">+ Create new ingredient</option>
                    </select>
                  </label>

                  <label>
                    <span>Amount</span>
                    <input
                      type="text"
                      value={item.amount}
                      onChange={(event) =>
                        updateIngredientRow(index, "amount", event.target.value)
                      }
                      placeholder="1 cup"
                    />
                  </label>

                  <button
                    type="button"
                    className={`toggle-pill toggle-pill-compact ${item.optional ? "active" : ""}`}
                    aria-pressed={item.optional}
                    onClick={() =>
                      updateIngredientRow(index, "optional", !item.optional)
                    }>
                    Optional
                  </button>
                </div>

                {item.createNew ? (
                  <div className="ingredient-editor-grid">
                    <label>
                      <span>New ingredient name</span>
                      <input
                        type="text"
                        name={`new-ingredient-name-${index}`}
                        inputMode="text"
                        autoComplete="new-password"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        value={item.newName}
                        onChange={(event) =>
                          updateIngredientRow(
                            index,
                            "newName",
                            event.target.value,
                          )
                        }
                        placeholder="Chickpeas"
                      />
                    </label>

                    <label>
                      <span>Ingredient category</span>
                      <select
                        value={item.newCategory}
                        onChange={(event) =>
                          updateIngredientRow(
                            index,
                            "newCategory",
                            event.target.value,
                          )
                        }>
                        {ingredientCategoryOptions.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ) : null}

                <button
                  type="button"
                  className="remove-icon-button"
                  onClick={() => removeIngredientRow(index)}
                  disabled={formState.ingredients.length === 1}
                  aria-label="Remove ingredient">
                  −
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="form-section">
          <div className="section-heading">
            <h3>Steps</h3>
            <button type="button" className="ghost-button" onClick={addStep}>
              Add step
            </button>
          </div>

          <div className="stack-list">
            {formState.steps.map((step, index) => (
              <div key={`step-${index}`} className="step-editor">
                <span className="step-index">{index + 1}</span>
                <textarea
                  rows="2"
                  value={step}
                  onChange={(event) => updateStep(index, event.target.value)}
                  placeholder="Describe the step simply"
                />
                <button
                  type="button"
                  className="remove-icon-button"
                  onClick={() => removeStep(index)}
                  disabled={formState.steps.length === 1}
                  aria-label="Remove step">
                  −
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="primary-button">
            Save recipe
          </button>
          <button type="button" className="ghost-button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
