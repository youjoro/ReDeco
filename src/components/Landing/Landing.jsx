import "./Landing.css";

const FEATURES = [
  {
    icon: "📸",
    title: "Start with your actual room",
    text: "Upload a photo of your space and furniture appears right inside it — no measuring tape needed.",
  },
  {
    icon: "🔍",
    title: "Try before you buy",
    text: "Search thousands of real furniture photos, drag them in, and see exactly how they fit before spending a penny.",
  },
  {
    icon: "💾",
    title: "Save every idea",
    text: "Create multiple layouts, come back anytime, and share what you're thinking with whoever lives there.",
  },
];

const STEPS = [
  { num: "1", title: "Upload your room", text: "Drop in a photo or start with a blank canvas." },
  { num: "2", title: "Add furniture", text: "Search or upload pieces — backgrounds strip automatically." },
  { num: "3", title: "Arrange freely", text: "Drag, resize, and snap until it feels exactly right." },
];

const MOCK_ITEMS = [
  { icon: "🛋️", top: "52%", left: "18%", w: 120, h: 70 },
  { icon: "🪴", top: "30%", left: "72%", w: 52, h: 64 },
  { icon: "🪑", top: "55%", left: "64%", w: 64, h: 64 },
  { icon: "🖼️", top: "14%", left: "22%", w: 72, h: 56 },
];

export default function Landing({ onGetStarted, onLogin }) {
  return (
    <div className="landing">

      {/* ── Nav ── */}
      <nav className="landing__nav">
        <div className="landing__nav-brand">
          <span className="landing__nav-icon">🪴</span>
          ReDeco
        </div>
        <div className="landing__nav-actions">
          <button className="landing__nav-link" onClick={onLogin}>Log in</button>
          <button className="landing__nav-btn" onClick={onGetStarted}>Try it free</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing__hero">
        <div className="landing__hero-copy">
          <p className="landing__hero-label">No design experience needed</p>
          <h1 className="landing__hero-title">
            See how your room<br />
            <em>could</em> look — before<br />
            you move a thing.
          </h1>
          <p className="landing__hero-sub">
            Upload a photo of your space, drop in furniture from our library,
            and rearrange everything until it feels like home.
          </p>
          <div className="landing__hero-ctas">
            <button className="landing__cta-primary" onClick={onGetStarted}>
              Start planning — it's free
            </button>
            <button className="landing__cta-ghost" onClick={onLogin}>
              I have an account
            </button>
          </div>
          <p className="landing__hero-note">No credit card · No download</p>
        </div>

        {/* Mock room preview */}
        <div className="landing__mock" aria-hidden="true">
          <div className="landing__mock-chrome">
            <span className="landing__mock-dot" />
            <span className="landing__mock-dot" />
            <span className="landing__mock-dot" />
          </div>
          <div className="landing__mock-room">
            <div className="landing__mock-wall" />
            {MOCK_ITEMS.map((item, i) => (
              <div
                key={i}
                className="landing__mock-item"
                style={{ top: item.top, left: item.left, width: item.w, height: item.h }}
              >
                {item.icon}
              </div>
            ))}
            <div className="landing__mock-grid" />
          </div>
        </div>
      </section>

      {/* ── Social proof strip ── */}
      <div className="landing__proof">
        <span>✓ Backgrounds removed automatically</span>
        <span className="landing__proof-sep" />
        <span>✓ Snap-to-grid alignment</span>
        <span className="landing__proof-sep" />
        <span>✓ Save unlimited rooms</span>
        <span className="landing__proof-sep" />
        <span>✓ Works on any device</span>
      </div>

      {/* ── Features ── */}
      <section className="landing__features-section">
        <h2 className="landing__section-title">Everything you need, nothing you don't</h2>
        <div className="landing__features">
          {FEATURES.map((f, i) => (
            <div key={i} className="landing__feature">
              <div className="landing__feature-icon">{f.icon}</div>
              <h3 className="landing__feature-title">{f.title}</h3>
              <p className="landing__feature-text">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="landing__steps-section">
        <h2 className="landing__section-title">Ready in seconds</h2>
        <div className="landing__steps">
          {STEPS.map((s, i) => (
            <div key={s.num} className="landing__step">
              <div className="landing__step-num">{s.num}</div>
              {i < STEPS.length - 1 && <div className="landing__step-line" />}
              <h3 className="landing__step-title">{s.title}</h3>
              <p className="landing__step-text">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="landing__final">
        <h2 className="landing__final-title">Your room is waiting.</h2>
        <p className="landing__final-sub">
          Give it 5 minutes — you might be surprised what a fresh layout can do.
        </p>
        <button className="landing__cta-primary" onClick={onGetStarted}>
          Start planning free →
        </button>
      </section>

      <footer className="landing__footer">
        © 2026 ReDeco · Made for anyone who's ever wanted a fresh space
      </footer>
    </div>
  );
}
