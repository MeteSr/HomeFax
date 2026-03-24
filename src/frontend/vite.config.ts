import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxy ICP canister API calls to local dfx replica
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  define: {
    // Expose environment variables to the app
    "process.env.DFX_NETWORK": JSON.stringify(process.env.DFX_NETWORK || "local"),
    "process.env.AUTH_CANISTER_ID": JSON.stringify(process.env.AUTH_CANISTER_ID || ""),
    "process.env.PROPERTY_CANISTER_ID": JSON.stringify(process.env.PROPERTY_CANISTER_ID || ""),
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
});
