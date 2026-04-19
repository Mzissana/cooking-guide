import { recipeCategories } from "../data/mockData";

export function FilterBar({
  filters,
  onFilterChange,
  settings,
  onSelectCategory,
  onToggleSimpleMode,
  onSuggestRecipe,
}) {
  const selectedCategories = recipeCategories.filter(
    (category) => settings.visibleRecipeCategories[category],
  );
  const allActive = selectedCategories.length === recipeCategories.length;

  return (
    <section className="panel filter-bar">
      <div className="filter-row">
        <div className="chip-row chip-row-scroll">
          <button
            type="button"
            className={`chip ${allActive ? "active" : ""}`}
            onClick={() => onSelectCategory("all")}>
            All
          </button>
          {recipeCategories.map((category) => (
            <button
              key={category}
              type="button"
              className={`chip ${!allActive && settings.visibleRecipeCategories[category] ? "active" : ""}`}
              onClick={() => onSelectCategory(category)}>
              {category[0].toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        <label className="switch">
          <input
            type="checkbox"
            checked={settings.simpleMode}
            onChange={onToggleSimpleMode}
          />
          <span>Simple mode</span>
        </label>
      </div>

      <div className="filter-row">
        <div className="chip-row">
          <button
            type="button"
            className={`chip ${filters.onlyCookable ? "active" : ""}`}
            onClick={() =>
              onFilterChange("onlyCookable", !filters.onlyCookable)
            }>
            Can cook now
          </button>
          <button
            type="button"
            className={`chip ${filters.lowEnergyOnly ? "active" : ""}`}
            onClick={() =>
              onFilterChange("lowEnergyOnly", !filters.lowEnergyOnly)
            }>
            Low energy
          </button>
          <button
            type="button"
            className={`chip ${filters.favoritesOnly ? "active" : ""}`}
            onClick={() =>
              onFilterChange("favoritesOnly", !filters.favoritesOnly)
            }>
            Favorites
          </button>
        </div>

        <div className="inline-controls">
          <label>
            <select
              value={filters.sortBy}
              onChange={(event) =>
                onFilterChange("sortBy", event.target.value)
              }>
              <option value="missing">Least missing</option>
              <option value="time">Cooking time</option>
              <option value="name">Name</option>
            </select>
          </label>

          <button
            type="button"
            className="ghost-button"
            onClick={onSuggestRecipe}>
            Cook today
          </button>
        </div>
      </div>
    </section>
  );
}
