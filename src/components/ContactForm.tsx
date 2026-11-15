import { useRef, useState } from "react";
import {
  buildWalkthroughBody,
  buildWalkthroughMailto,
  isContactConfigured,
  type WalkthroughRequest,
  type WalkthroughSelection,
} from "../lib/contact";

export function ContactForm({
  email,
  selections,
  askedAbout,
}: {
  email: string;
  selections: WalkthroughSelection[];
  askedAbout?: string;
}) {
  const form = useRef<HTMLFormElement>(null);
  const revision = useRef(0);
  const [request, setRequest] = useState<WalkthroughRequest>({
    name: "",
    email: "",
    town: "",
    message: "",
  });
  const [status, setStatus] = useState("");
  const [copying, setCopying] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const body = buildWalkthroughBody(selections, request, askedAbout);

  function update(field: keyof WalkthroughRequest, value: string) {
    revision.current += 1;
    setRequest((previous) => ({ ...previous, [field]: value }));
    setStatus("");
    if (field === "message") {
      const message = form.current?.elements.namedItem(
        "message",
      ) as HTMLTextAreaElement | null;
      message?.setCustomValidity("");
    }
  }

  function valid() {
    const message = form.current?.elements.namedItem(
      "message",
    ) as HTMLTextAreaElement | null;
    message?.setCustomValidity(
      request.message.trim() ? "" : "Describe what needs doing.",
    );
    return form.current?.reportValidity();
  }

  function prepareDraft() {
    if (!valid()) return;
    setShowRequest(true);
    const href = buildWalkthroughMailto(email, selections, request, askedAbout);
    if (href.length > 1800) {
      setStatus(
        "This request is too long for a reliable email link. Copy the request below and email it to the address shown.",
      );
      return;
    }
    setStatus(
      "Send the draft from your email app. If it did not open, copy your request below.",
    );
    window.location.href = href;
  }

  async function copyRequest() {
    if (!valid()) return;
    setShowRequest(true);
    setCopying(true);
    const version = revision.current;
    try {
      await navigator.clipboard.writeText(body);
      if (version === revision.current)
        setStatus(
          "Request copied. Paste it into an email and send it to the address shown.",
        );
    } catch {
      if (version === revision.current)
        setStatus(
          "Copy was unavailable. Select the request text below and copy it manually into your email.",
        );
    } finally {
      setCopying(false);
    }
  }

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="contact-card scroll-mt-6"
    >
      <h2 id="contact-heading" className="text-[22px] font-semibold">
        Request a walkthrough
      </h2>
      <p id="contact-help" className="mt-1 text-[14px] text-ink-2">
        Tell us what needs doing and where the job is.
      </p>
      {isContactConfigured({ email }) ? (
        <>
          <form
            ref={form}
            aria-describedby="contact-help contact-delivery"
            onSubmit={(event) => {
              event.preventDefault();
              prepareDraft();
            }}
            className="contact-form"
          >
            <div className="contact-pair">
              <div className="contact-field">
                <label htmlFor="contact-name">Name (optional)</label>
                <input
                  id="contact-name"
                  name="name"
                  autoComplete="name"
                  maxLength={100}
                  value={request.name}
                  onChange={(event) => update("name", event.target.value)}
                />
              </div>
              <div className="contact-field">
                <label htmlFor="contact-email">Email</label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={request.email}
                  onChange={(event) => update("email", event.target.value)}
                />
              </div>
            </div>
            <div className="contact-field">
              <label htmlFor="contact-town">Town or ZIP (optional)</label>
              <input
                id="contact-town"
                name="town"
                autoComplete="address-level2"
                maxLength={100}
                value={request.town}
                onChange={(event) => update("town", event.target.value)}
              />
            </div>
            <div className="contact-field">
              <label htmlFor="contact-message">What needs doing?</label>
              <textarea
                id="contact-message"
                name="message"
                required
                rows={3}
                maxLength={10000}
                value={request.message}
                onChange={(event) => update("message", event.target.value)}
              />
            </div>
            {askedAbout && (
              <p className="text-[13px] text-ink-2">
                Your request will name the service you were viewing:{" "}
                {askedAbout}.
              </p>
            )}
            {selections.length > 0 && (
              <p className="text-[13px] text-ink-2">
                Your current estimate selections will be included, with
                quantities and units. Prices are not included.
              </p>
            )}
            <p
              id="contact-delivery"
              className="text-[13px] leading-snug text-ink-2"
            >
              This prepares an email. You send it from your email app. Nothing
              is submitted from this website. Email and job details are
              required.
            </p>
            <div className="contact-actions">
              <button type="submit" className="primary-action">
                Open email draft
              </button>
              <button type="button" onClick={copyRequest} disabled={copying}>
                {copying ? "Copying request..." : "Copy request"}
              </button>
            </div>
          </form>
          <p role="status" className="mt-3 text-[14px]" aria-live="polite">
            {status}
          </p>
          {showRequest && (
            <div className="mt-3">
              <h3 className="text-[14px] font-medium">Your request text</h3>
              <pre
                tabIndex={0}
                aria-label="Your request text"
                className="request-text"
              >
                {body}
              </pre>
            </div>
          )}
          <p className="mt-3 text-[14px] text-ink-2">
            Or email{" "}
            <a className="contact-email" href={`mailto:${email}`}>
              {email}
            </a>
          </p>
        </>
      ) : (
        <p className="mt-3">Contact details are being updated.</p>
      )}
    </section>
  );
}
