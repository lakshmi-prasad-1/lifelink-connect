import { createRoot } from "react-dom/client";
import "./index.css";

const root = document.getElementById("root")!;

function showConfigError() {
  const setupSteps = import.meta.env.PROD
    ? `Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> in your Vercel project under <strong>Settings → Environment Variables</strong>, then redeploy.`
    : `Copy <code>.env.example</code> to <code>.env</code>, set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>, then restart the dev server.`;

  root.innerHTML = `
    <div style="font-family: system-ui, sans-serif; max-width: 32rem; margin: 4rem auto; padding: 0 1rem; color: #1a1a1a;">
      <h1 style="font-size: 1.25rem; margin-bottom: 0.5rem;">Configuration required</h1>
      <p style="color: #555; line-height: 1.5;">${setupSteps}</p>
    </div>
  `;
}

async function bootstrap() {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
    showConfigError();
    return;
  }

  const { default: App } = await import("./App.tsx");
  createRoot(root).render(<App />);
}

bootstrap();
