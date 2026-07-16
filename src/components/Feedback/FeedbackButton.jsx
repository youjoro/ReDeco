import { useState } from "react";
import * as Sentry from "@sentry/react";
import "./FeedbackButton.css";

export default function FeedbackButton({ user }) {
  const [open, setOpen]       = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus]   = useState(null); // null | "sending" | "sent" | "error"

  function openModal() { setOpen(true); setStatus(null); setMessage(""); }
  function closeModal() { setOpen(false); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus("sending");
    try {
      Sentry.withScope((scope) => {
        scope.setTag("feedback", "user-report");
        if (user?.email) scope.setUser({ email: user.email });
        Sentry.captureMessage(`[Feedback] ${message.trim()}`, "info");
      });
      setStatus("sent");
      setMessage("");
      // Auto-close after 2 s
      setTimeout(() => setOpen(false), 2000);
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <button
        className="feedback-trigger"
        onClick={openModal}
        aria-label="Send feedback"
        title="Report a problem or share feedback"
      >
        💬 Feedback
      </button>

      {open && (
        <div className="feedback-overlay" onClick={closeModal} role="dialog" aria-modal="true">
          <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
            <div className="feedback-modal__header">
              <span className="feedback-modal__title">Send feedback</span>
              <button className="feedback-modal__close" onClick={closeModal} aria-label="Close">✕</button>
            </div>

            {status === "sent" ? (
              <div className="feedback-modal__success">
                <span>✅</span>
                <p>Thanks! Your feedback was received.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <p className="feedback-modal__hint">
                  Found a bug or have a suggestion? Let us know — errors are logged automatically,
                  but your description helps a lot.
                </p>

                <textarea
                  className="feedback-modal__textarea"
                  placeholder="Describe what happened or what you'd like to see…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  autoFocus
                  disabled={status === "sending"}
                />

                {status === "error" && (
                  <p className="feedback-modal__error">Something went wrong — please try again.</p>
                )}

                <div className="feedback-modal__footer">
                  <span className="feedback-modal__charcount">{message.length}/1000</span>
                  <button
                    type="submit"
                    className="feedback-modal__submit"
                    disabled={!message.trim() || status === "sending"}
                  >
                    {status === "sending" ? "Sending…" : "Send feedback"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
