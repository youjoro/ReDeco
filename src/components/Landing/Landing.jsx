import "./Landing.css";

const MOCK_ITEMS = [
  { icon: "🪴", top: "58%", left: "8%",  w: 34, h: 26 },
  { icon: "🪑", top: "40%", left: "62%", w: 22, h: 22 },
  { icon: "🛏️", top: "20%", left: "30%", w: 30, h: 22 },
  { icon: "🪴", top: "62%", left: "78%", w: 18, h: 22 },
];

const FEATURES = [
  { icon: "🔍", title: "Search real furniture photos", text: "Find sofas, chairs, lamps and more from a huge photo library right inside the app." },
  { icon: "✂️", title: "Backgrounds removed automatically", text: "Every image you add gets its background stripped so it drops cleanly into your room." },
  { icon: "🖱️", title: "Drag, drop, and resize", text: "Move furniture freely and resize with a simple handle — proportions stay accurate." },
  { icon: "📐", title: "Snap to a custom grid", text: "Drag a slider to set your own grid size and keep every placement perfectly aligned." },
  { icon: "💾", title: "Save unlimited rooms", text: "Come back anytime — your layouts, backgrounds, and furniture are saved to your account." },
  { icon: "📱", title: "Works on any device", text: "Plan on your laptop, tweak on your phone. The whole experience adapts to your screen." },
];

const STEPS = [
  { num: "1", title: "Set your room", text: "Upload a photo of your space or start with a blank canvas." },
  { num: "2", title: "Add furniture", text: "Search or upload pieces — backgrounds are removed automatically." },
  { num: "3", title: "Arrange and save", text: "Drag, resize, snap to grid, then save your layout to revisit later." },
];

export default function Landing({ onGetStarted, onLogin }) {
  return (
    <div className="landing">
      {/* Nav */}
      <div className="landing__nav">
        <div className="landing__nav-brand">
          <span className="landing__nav-icon">🪴</span>
          ReDeco
        </div>
        <div className="landing__nav-actions">
          <button className="landing__nav-btn landing__nav-btn--ghost" onClick={onLogin}>Log In</button>
          <button className="landing__nav-btn landing__nav-btn--primary" onClick={onGetStarted}>Get Started</button>
        </div>
      </div>

      {/* Hero */}
      <div className="landing__hero">
        <div>
          <span className="landing__hero-eyebrow">Free to start</span>
          <h1 className="landing__hero-title">
            Plan your room <span>before you buy a single thing</span>
          </h1>
          <p className="landing__hero-sub">
            Drop your room photo in, search for furniture, and see how it actually looks —
            drag, resize, and snap pieces into place until it feels right.
          </p>
          <div className="landing__hero-ctas">
            <button className="landing__cta-primary" onClick={onGetStarted}>Start planning free →</button>
            <button className="landing__cta-secondary" onClick={onLogin}>I already have an account</button>
          </div>
        </div>

        {/* Mock preview */}
        <div className="landing__mock">
          <div className="landing__mock-bar">
            <span className="landing__mock-dot" />
            <span className="landing__mock-dot" />
            <span className="landing__mock-dot" />
          </div>
          <div className="landing__mock-body">
            {MOCK_ITEMS.map((item, i) => (
              <div
                key={i}
                className="landing__mock-item"
                style={{ top: item.top, left: item.left, width: `${item.w * 3}px`, height: `${item.h * 3}px` }}
              >
                {item.icon}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="landing__section">
        <h2 className="landing__section-title">Everything you need to visualize a room</h2>
        <p className="landing__section-sub">No design experience required.</p>
        <div className="landing__features">
          {FEATURES.map((f, i) => (
            <div key={i} className="landing__feature">
              <div className="landing__feature-icon">{f.icon}</div>
              <div className="landing__feature-title">{f.title}</div>
              <div className="landing__feature-text">{f.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="landing__section">
        <h2 className="landing__section-title">How it works</h2>
        <p className="landing__section-sub">Three steps, no downloads.</p>
        <div className="landing__steps">
          {STEPS.map((s) => (
            <div key={s.num} className="landing__step">
              <div className="landing__step-num">{s.num}</div>
              <div className="landing__step-title">{s.title}</div>
              <div className="landing__step-text">{s.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div className="landing__banner">
        <div className="landing__banner-title">Ready to see your room come together?</div>
        <div className="landing__banner-sub">It's free to get started — no credit card needed.</div>
        <button className="landing__cta-primary" onClick={onGetStarted}>Create your first room →</button>
      </div>

      <div className="landing__footer">© 2026 ReDeco · Made for anyone furnishing a space</div>
    </div>
  );
}
