import { recipeStatusLabels } from "../data/mockData";

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

export function RecipeCard({ recipe, onOpen, onToggleFavorite, simpleMode }) {
  return (
    <article className={`recipe-card recipe-row ${simpleMode ? "simple" : ""}`}>
      <button
        type="button"
        className="favorite-button"
        onClick={(event) => {
          event.stopPropagation();
          onToggleFavorite(recipe.id);
        }}
        aria-label={
          recipe.favorite ? "Remove from favorites" : "Add to favorites"
        }>
        {recipe.favorite ? "♥" : "♡"}
      </button>

      <button
        type="button"
        className="recipe-row-button"
        onClick={() => onOpen(recipe.id)}>
        <div className="recipe-row-thumb" aria-hidden="true">
          {recipe.image ? (
            <img src={recipe.image} alt="" loading="lazy" />
          ) : (
            <span className="recipe-row-emoji">🍽️</span>
          )}
        </div>

        <div className="recipe-row-main">
          <h3>{recipe.name}</h3>
          <p className="recipe-row-sub">
            <span className={`mini-badge badge-${recipe.availabilityStatus}`}>
              {getRecipeStatusLabel(recipe)}
            </span>
            <span className="muted">⏱ {recipe.time} min</span>
          </p>
        </div>
      </button>
    </article>
  );
}
