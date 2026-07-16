import { useShoppingList } from "../../context/ShoppingListContext";
import { sanitizeHref, sanitizeImageSrc } from "../../lib/security";
import "./ShoppingListPanel.css";

function ShoppingListItem({ row, onUpdateQuantity, onRemove }) {
  const product = row.furniture_items;
  if (!product) return null;

  return (
    <div className="shop-item">
      <div className="shop-item__thumb">
        <img src={sanitizeImageSrc(product.image_url)} alt={product.name} onError={(e) => { e.target.style.visibility = "hidden"; }} />
      </div>

      <div className="shop-item__info">
        <div className="shop-item__top-row">
          <span className="shop-item__name">{product.name}</span>
          {product.sponsored && <span className="shop-item__sponsored">Sponsored</span>}
        </div>

        <span className="shop-item__retailer">{product.retailer_name}</span>

        <div className="shop-item__bottom-row">
          <span className="shop-item__price">${Number(product.price).toFixed(2)}</span>
          <a className="shop-item__buy" href={sanitizeHref(product.product_url)} target="_blank" rel="noopener noreferrer">
            View →
          </a>
        </div>

        <div className="shop-item__qty">
          <button className="shop-item__qty-btn" onClick={() => onUpdateQuantity(row.id, row.quantity - 1)}>−</button>
          <span className="shop-item__qty-val">{row.quantity}</span>
          <button className="shop-item__qty-btn" onClick={() => onUpdateQuantity(row.id, row.quantity + 1)}>+</button>
        </div>
      </div>

      <button className="shop-item__remove" onClick={() => onRemove(row.id)} aria-label="Remove">×</button>
    </div>
  );
}

export default function ShoppingListPanel({ onClose }) {
  const { items, loading, error, total, updateQuantity, removeItem, clearError } = useShoppingList();

  return (
    <>
      <div className="shop-overlay" onClick={onClose} />
      <div className="shop-panel">
        <div className="shop-panel__header">
          <span className="shop-panel__title">
            🛒 Shopping List
            {items.length > 0 && <span className="shop-panel__count">{items.length}</span>}
          </span>
          <button className="shop-panel__close" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="shop-panel__error" onClick={clearError}>{error}</div>
        )}

        <div className="shop-panel__list">
          {loading && (
            <div className="shop-panel__loading">
              <span style={{ fontSize: 28 }}>⏳</span>
              <span>Loading your list…</span>
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="shop-panel__empty">
              <span className="shop-panel__empty-icon">🛍️</span>
              <span className="shop-panel__empty-title">Your list is empty</span>
              <span className="shop-panel__empty-sub">
                Add furniture from your room to build a shopping list.
              </span>
            </div>
          )}

          {!loading && items.map((row) => (
            <ShoppingListItem
              key={row.id}
              row={row}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
            />
          ))}
        </div>

        {items.length > 0 && (
          <div className="shop-panel__footer">
            <p className="shop-panel__disclosure">
              Some links may earn us a commission at no extra cost to you.
            </p>
            <div className="shop-panel__total-row">
              <span className="shop-panel__total-label">Total</span>
              <span className="shop-panel__total-value">${total.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
