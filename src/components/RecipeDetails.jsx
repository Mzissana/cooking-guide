import { recipeStatusLabels, statusLabels } from "../data/mockData";
import {
  IconArrowLeft,
  IconCart,
  IconClock,
  IconPlate,
  IconPlayCircle,
} from "./Icons";

function formatMissingLabel(count) {
  return count === 1 ? "Missing 1 ingredient" : `Missing ${count} ingredients`;
}

function getRecipeStatusLabel(recipe) {
  if (recipe.availabilityStatus === "no_ingredients") {
    return "No ingredients";
  }

  if (
    recipe.availabilityStatus === "almost_ready" ||
    recipe.availabilityStatus === "missing_many"
  ) {
    return formatMissingLabel(recipe.missingIngredientsCount);
  }

  return recipeStatusLabels[recipe.availabilityStatus];
}

export function RecipeDetails({
  recipe,
  ingredientMap,
  stepChecks,
  onToggleStep,
  onBack,
  onEdit,
  onDelete,
  onAddMissingToShopping,
  onCycleIngredientStatus,
}) {
  const missingRequiredIngredients = recipe.ingredients.filter((item) => {
    if (item.optional) {
      return false;
    }

    const ingredient = ingredientMap[item.ingredientId];
    return !ingredient || ingredient.status === "need_to_buy";
  });

  return (
    <section className="detail-view detail-screen">
      <div className="detail-image-hero">
        {recipe.image ? (
          <img src={recipe.image} alt={recipe.name} className="detail-image" />
        ) : (
          <div className="recipe-card-placeholder large">
            <IconPlate />
          </div>
        )}

        <button
          type="button"
          className="icon-button icon-button-left"
          onClick={onBack}
          aria-label="Back">
          <IconArrowLeft />
        </button>
      </div>

      <div className="detail-right">
        <div className="panel detail-sheet">
          <div className="detail-topline">
            <span className={`mini-badge badge-${recipe.availabilityStatus}`}>
              {getRecipeStatusLabel(recipe)}
            </span>
            <span className="muted inline-icon">
              <IconClock />
              {recipe.time} min
            </span>
          </div>

          <h2>{recipe.name}</h2>
          <p className="muted">
            {recipe.availableIngredients} available ·{" "}
            {recipe.missingIngredientsCount} missing
          </p>

          <div className="detail-metrics">
            <div className="metric-card">
              <span aria-hidden="true">
                <IconClock />
              </span>
              <p className="muted">Cooking time</p>
              <strong>{recipe.time} min</strong>
            </div>
            <div className="metric-card">
              <span aria-hidden="true">
                <IconCart />
              </span>
              <p className="muted">Missing</p>
              <strong>{recipe.missingIngredientsCount}</strong>
            </div>
          </div>

          <div className="detail-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => onAddMissingToShopping(recipe.id)}
              disabled={missingRequiredIngredients.length === 0}>
              Add missing to shopping list
            </button>
            <button type="button" className="ghost-button" onClick={onEdit}>
              Edit recipe
            </button>
            <button type="button" className="danger-button" onClick={onDelete}>
              Delete
            </button>
          </div>

          {recipe.videoUrl ? (
            <a
              href={recipe.videoUrl}
              className="video-link"
              target="_blank"
              rel="noreferrer">
              <IconPlayCircle />
              Watch recipe video
            </a>
          ) : null}
        </div>

        <section className="panel detail-ingredients">
          <div className="section-heading">
            <h3>Ingredients ({recipe.ingredients.length})</h3>
          </div>
          <div className="stack-list">
            {recipe.ingredients.map((item) => {
              const ingredient = ingredientMap[item.ingredientId];
              const missing =
                !ingredient || ingredient.status === "need_to_buy";

              return (
                <div
                  key={`${recipe.id}-${item.ingredientId}`}
                  className={`ingredient-row ${missing ? "missing" : ""}`}>
                  <div>
                    <strong>{ingredient?.name ?? "Unknown ingredient"}</strong>
                    <p className="muted">
                      {item.amount || "Amount not set"}
                      {item.optional ? " · optional" : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`status-pill status-visual ${ingredient?.status ?? "need_to_buy"}`}
                    aria-label={
                      statusLabels[ingredient?.status ?? "need_to_buy"]
                    }
                    title={statusLabels[ingredient?.status ?? "need_to_buy"]}
                    onClick={() => onCycleIngredientStatus?.(item.ingredientId)}
                    disabled={!ingredient}>
                    <span className="status-indicator" aria-hidden="true">
                      <span className="status-bar" />
                      <span className="status-bar" />
                      <span className="status-bar" />
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="panel detail-steps">
        <div className="section-heading">
          <h3>Steps</h3>
        </div>
        <div className="stack-list">
          {recipe.steps.map((step, index) => (
            <label
              key={`${recipe.id}-step-${index}`}
              className={`step-item ${stepChecks[index] ? "done" : ""}`}>
              <input
                type="checkbox"
                checked={Boolean(stepChecks[index])}
                onChange={() => onToggleStep(recipe.id, index)}
              />
              <span>{step}</span>
            </label>
          ))}
        </div>
      </section>
    </section>
  );
}
