import "./PaywallModal.css";

const FREE_LIMIT = 10;

export default function PaywallModal({ roomCount, onClose }) {
  return (
    <div className="paywall__overlay" onClick={onClose}>
      <div className="paywall__modal" onClick={(e) => e.stopPropagation()}>
        <button className="paywall__close" onClick={onClose} aria-label="Close">×</button>

        <div className="paywall__icon">🔒</div>
        <h2 className="paywall__title">You've used your free room</h2>
        <p className="paywall__sub">
          Free accounts include <strong>{FREE_LIMIT} saved rooms</strong>. You have {roomCount} — upgrade to keep designing without limits.
        </p>

        <div className="paywall__plans">
          {/* Free plan */}
          <div className="paywall__plan">
            <div className="paywall__plan-name">Free</div>
            <div className="paywall__plan-price">$0<span>/mo</span></div>
            <ul className="paywall__plan-features">
              <li>✓ 10 saved rooms</li>
              <li>✓ Furniture search</li>
              <li>✓ Shopping list</li>
              <li className="paywall__feature--muted">✗ Multiple rooms</li>
              <li className="paywall__feature--muted">✗ Priority support</li>
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
              <li>✓ Furniture search</li>
              <li>✓ Shopping list</li>
              <li>✓ Multiple rooms</li>
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
