import { statusLabels } from "../data/mockData";

export function IngredientItem({
  ingredient,
  onCycleStatus,
  onEdit,
  onDelete,
}) {
  return (
    <div className="ingredient-item">
      <div>
        <strong>{ingredient.name}</strong>
        <p className="muted">{ingredient.category}</p>
      </div>

      <div className="ingredient-item-actions">
        <button
          type="button"
          className={`status-pill status-visual ${ingredient.status}`}
          onClick={() => onCycleStatus(ingredient.id)}
          aria-label={statusLabels[ingredient.status]}
          title={statusLabels[ingredient.status]}>
          <span className="status-indicator" aria-hidden="true">
            <span className="status-bar" />
            <span className="status-bar" />
            <span className="status-bar" />
          </span>
        </button>
        <button
          type="button"
          className="ghost-button compact"
          onClick={() => onEdit(ingredient.id)}>
          Edit
        </button>
        <button
          type="button"
          className="ghost-button compact"
          onClick={() => onDelete(ingredient.id)}>
          Delete
        </button>
      </div>
    </div>
  );
}
