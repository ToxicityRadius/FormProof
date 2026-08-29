import { useState } from "react";

export function App() {
  const [status, setStatus] = useState("");

  return (
    <main>
      <h1>Account settings</h1>
      <div id="retired-actions" aria-hidden="true">
        <p>Legacy reporting is no longer available.</p>
        <button id="legacy-export" type="button" disabled>Export legacy report</button>
      </div>
      <button id="save-changes" type="button" onClick={() => setStatus("Changes saved.")}>
        Save changes
      </button>
      <p role="status" aria-live="polite">{status}</p>
    </main>
  );
}
