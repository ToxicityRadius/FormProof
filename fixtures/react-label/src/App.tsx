import { useState, type FormEvent } from "react";

export function App() {
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = displayName.trim();
    setStatus(name ? `Profile saved for ${name}.` : "Enter a display name.");
  }

  return (
    <main>
      <h1>Account</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="display-name">Display name</label>
        <input
          id="display-name"
          name="displayName"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          autoComplete="name"
        />
        <button type="submit">Save</button>
      </form>
      <p role="status" aria-live="polite">{status}</p>
    </main>
  );
}
