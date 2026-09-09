// Vitest runs under Node, not a browser — Node 22+ ships a native
// WebSocket global, but this machine (and CI, until it's upgraded) is on
// Node 20, and @supabase/supabase-js's realtime client throws at
// construction without one, even for tests that never touch realtime.
// The real app is unaffected: every browser has native WebSocket.
import { WebSocket } from "ws";

if (!("WebSocket" in globalThis)) {
  (globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket = WebSocket;
}
