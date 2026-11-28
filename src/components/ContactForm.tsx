import { useRef, useState } from "react";
import {
  isContactConfigured,
  isPhoneUserAgent,
  walkthroughDrafts,
  type WalkthroughRequest,
  type WalkthroughSelection,
} from "../lib/contact";

const webMail = [
  { key: "gmail", name: "Gmail" },
  { key: "outlook", name: "Outlook" },
] as const;

export function ContactForm({
  email,
  selections,
  askedAbout,
  onLeaveOut,
}: {
  email: string;
  selections: WalkthroughSelection[];
  askedAbout?: string;
  onLeaveOut?: () => void;
}) {
  const form = useRef<HTMLFormElement>(null);
  const [request, setRequest] = useState<WalkthroughRequest>({
    name: "",
    email: "",
    town: "",
    message: "",
  });
  const [feedback, setFeedback] = useState({ text: "", body: "" });
  const [copying, setCopying] = useState(false);
  const [copyingAddress, setCopyingAddress] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const phone =
    typeof navigator !== "undefined" && isPhoneUserAgent(navigator.userAgent);
  const drafts = walkthroughDrafts(email, selections, request, askedAbout);
  const body = drafts.body;
  const status = feedback.body === body ? feedback.text : "";
  const setStatus = (text: string, about = body) =>
    setFeedback({ text, body: about });

  function update(field: keyof WalkthroughRequest, value: string) {
    setRequest((previous) => ({ ...previous, [field]: value }));
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

  function openDraft(
    kind: "mailto" | (typeof webMail)[number]["key"],
    sent: string,
  ) {
    if (!valid()) return;
    setShowRequest(true);
    const href = drafts[kind];
    if (href.length > 1800) {
      setStatus(
        "This request is too long for a reliable email link. Copy the request below and email it to the address shown.",
      );
      return;
    }
    setStatus(`${sent} If it did not open, copy your request below.`);
    if (kind === "mailto") window.location.href = href;
    else window.open(href, "_blank", "noopener,noreferrer");
  }

  async function copyRequest() {
    if (!valid()) return;
    setShowRequest(true);
    setCopying(true);
    const copied = body;
    try {
      await navigator.clipboard.writeText(copied);
      setStatus(
        "Request copied. Paste it into an email and send it to the address shown.",
        copied,
      );
    } catch {
      setStatus(
        "Copy was unavailable. Select the request text below and copy it manually into your email.",
        copied,
      );
    } finally {
      setCopying(false);
    }
  }

  async function copyEmailAddress() {
    setCopyingAddress(true);
    try {
      await navigator.clipboard.writeText(email);
      setStatus("Email address copied. Paste it into the To field of your email.");
    } catch {
      setStatus(`Copy was unavailable. Select and copy this address: ${email}`);
    } finally {
      setCopyingAddress(false);
    }
  }

  const field = (
    name: keyof WalkthroughRequest,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement>,
  ) => (
    <div className="contact-field">
      <label htmlFor={`contact-${name}`}>
        {label}
        {!props.required && <span className="optional"> (optional)</span>}
      </label>
      <input
        id={`contact-${name}`}
        name={name}
        value={request[name]}
        onChange={(event) => update(name, event.target.value)}
        {...props}
      />
    </div>
  );

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="contact-card scroll-mt-6"
    >
      <header>
        <p className="eyebrow">Start with a conversation</p>
        <h2 id="contact-heading">What needs a hand?</h2>
        <p id="contact-help" className="contact-lead">
          Start with a few details about the job.
        </p>
      </header>
      {isContactConfigured({ email }) ? (
        <>
          <div className="contact-body">
            <form
              ref={form}
              aria-describedby="contact-help contact-delivery"
              onSubmit={(event) => {
                event.preventDefault();
                openDraft("mailto", "Send the draft from your email app.");
              }}
              className="contact-form"
            >
              <div className="contact-details">
                {field("name", "Name", {
                  autoComplete: "name",
                  maxLength: 100,
                  placeholder: "Your name",
                })}
                {field("email", "Email", {
                  type: "email",
                  autoComplete: "email",
                  required: true,
                  maxLength: 254,
                  placeholder: "you@example.com",
                })}
                {field("town", "Town or ZIP", {
                  autoComplete: "address-level2",
                  maxLength: 100,
                  placeholder: "Where is the job?",
                })}
              </div>
              <div className="contact-field contact-job">
                <label htmlFor="contact-message">What needs doing?</label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={3}
                  maxLength={10000}
                  placeholder="A repair, an installation, or a few things on your list"
                  value={request.message}
                  onChange={(event) => update("message", event.target.value)}
                />
              </div>
              {askedAbout && (
                <p className="contact-note">
                  Your request will name the service you were viewing:{" "}
                  {askedAbout}.{" "}
                  {onLeaveOut && (
                    <button
                      type="button"
                      onClick={onLeaveOut}
                      className="font-semibold text-ink underline underline-offset-2"
                    >
                      Leave {askedAbout} out
                    </button>
                  )}
                </p>
              )}
              {selections.length > 0 && (
                <p className="contact-note">
                  Your current estimate selections will be included, with
                  quantities and units. Prices are not included.
                </p>
              )}
              <p id="contact-delivery" className="contact-note">
                {phone ? (
                  <>Opens a draft in your email app.</>
                ) : (
                  <>Opens a draft in your email app, Gmail or Outlook.</>
                )}{" "}
                You review and send it yourself; nothing is sent from this
                website. If nothing opens, copy the request and paste it into
                an email to {email}.
              </p>
              <div
                className={
                  phone ? "contact-actions contact-actions-phone" : "contact-actions"
                }
              >
                <button type="submit" className="primary-action">
                  Open email draft <span aria-hidden="true">↗</span>
                </button>
                {phone ? (
                  <button
                    type="button"
                    onClick={copyEmailAddress}
                    disabled={copyingAddress}
                  >
                    {copyingAddress ? "Copying email address..." : "Copy email address"}
                  </button>
                ) : webMail.map(({ key, name }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      openDraft(key, `Finish and send the message in ${name}.`)
                    }
                  >
                    Open in {name}
                    <span className="sr-only"> (opens in a new tab)</span>{" "}
                    <span aria-hidden="true">↗</span>
                  </button>
                ))}
                <button type="button" onClick={copyRequest} disabled={copying}>
                  {copying ? "Copying request..." : "Copy request"}
                </button>
              </div>
            </form>
            <p role="status" aria-live="polite">
              {status}
            </p>
            {showRequest && (
              <div className="mt-3">
                <h3 className="text-[14px] font-semibold">Your request text</h3>
                <pre
                  tabIndex={0}
                  aria-label="Your request text"
                  className="request-text"
                >
                  {body}
                </pre>
              </div>
            )}
          </div>
          <p className="contact-fallback">
            Or write to{" "}
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
