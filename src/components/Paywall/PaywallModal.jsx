import "./PaywallModal.css";

const FREE_ROOM_LIMIT  = 3;
const FREE_ITEM_LIMIT  = 50;

const CONFIGS = {
  rooms: {
    icon:  "🔒",
    title: "You've used all your free rooms",
    sub:   (count) =>
      `Free accounts include ${FREE_ROOM_LIMIT} saved rooms. You have ${count} — upgrade to keep designing without limits.`,
    freeFeature: `${FREE_ROOM_LIMIT} saved rooms`,
  },
  items: {
    icon:  "📦",
    title: "You've reached the item limit",
    sub:   (count) =>
      `Free accounts can place up to ${FREE_ITEM_LIMIT} items per room. This room has ${count} — upgrade to add as many as you like.`,
    freeFeature: `Up to ${FREE_ITEM_LIMIT} items / room`,
  },
};

export default function PaywallModal({ type = "rooms", count, onClose }) {
  const cfg = CONFIGS[type];

  return (
    <div className="paywall__overlay" onClick={onClose}>
      <div className="paywall__modal" onClick={(e) => e.stopPropagation()}>
        <button className="paywall__close" onClick={onClose} aria-label="Close">×</button>

        <div className="paywall__icon">{cfg.icon}</div>
        <h2 className="paywall__title">{cfg.title}</h2>
        <p className="paywall__sub">{cfg.sub(count)}</p>

        <div className="paywall__plans">
          {/* Free plan */}
          <div className="paywall__plan">
            <div className="paywall__plan-name">Free</div>
            <div className="paywall__plan-price">$0<span>/mo</span></div>
            <ul className="paywall__plan-features">
              <li>✓ {cfg.freeFeature}</li>
              <li>✓ Furniture search</li>
              <li>✓ Shopping list</li>
              <li className="paywall__feature--muted">✗ Unlimited rooms</li>
              <li className="paywall__feature--muted">✗ Unlimited items</li>
            </ul>
            <div className="paywall__plan-current">Current plan</div>
          </div>

          {/* Pro plan */}
          <div className="paywall__plan paywall__plan--pro">
            <div className="paywall__plan-badge">Most popular</div>
            <div className="paywall__plan-name">Pro</div>
            <div className="paywall__plan-price">$5<span>/mo</span></div>
            <ul className="paywall__plan-features">
              <li>✓ Unlimited rooms</li>
              <li>✓ Unlimited items</li>
              <li>✓ Furniture search</li>
              <li>✓ Shopping list</li>
              <li>✓ Priority support</li>
            </ul>
            <button className="paywall__upgrade-btn" onClick={onClose}>
              Upgrade to Pro →
            </button>
          </div>
        </div>

        <p className="paywall__note">Payments coming soon — check back shortly.</p>
      </div>
    </div>
  );
}
