import { type FormEvent, useState } from "react";

export function App() {
  const [email, setEmail] = useState("");
  const [invalid, setInvalid] = useState(true);
  const [status, setStatus] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("email");
    if (!(input instanceof HTMLInputElement) || !input.validity.valid) {
      setInvalid(true);
      setStatus("");
      return;
    }

    setInvalid(false);
    setStatus(`Subscription saved for ${email}.`);
  }

  return (
    <main>
      <h1>Newsletter</h1>
      <form noValidate onSubmit={handleSubmit}>
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={email}
          aria-invalid={invalid ? "true" : undefined}
          aria-errormessage="email-error"
          onChange={(event) => setEmail(event.target.value)}
        />
        <p id="email-error" role="alert" hidden={!invalid}>Enter a valid email address.</p>
        <button type="submit">Subscribe</button>
      </form>
      <p role="status" aria-live="polite">{status}</p>
    </main>
  );
}
