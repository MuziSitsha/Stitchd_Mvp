import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Separate from vite.config.ts on purpose: the RLS/integration suite in
// tests/rls needs real env vars (VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
// and a long timeout for network round-trips against local Supabase, neither
// of which belong anywhere near the production build config.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "tests/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
    globalSetup: ["./tests/global-setup.ts"],
    testTimeout: 15_000,
    hookTimeout: 20_000,
    // The RLS/integration files all hit one local Supabase — running them
    // in parallel put enough pressure on Postgres connections and the Edge
    // runtime to flake fixture setup and async edge-function round trips.
    // Sequential is the right shape for this kind of suite; it costs ~30s.
    fileParallelism: false,
  },
});
