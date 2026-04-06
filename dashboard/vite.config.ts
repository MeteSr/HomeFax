import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, ".."), "");

  return {
    plugins: [react()],
    envDir: path.resolve(__dirname, ".."),
    server: {
      port: 3002,
    },
    define: {
      "process.env.DFX_NETWORK":         JSON.stringify(env.DFX_NETWORK         || "local"),
      "process.env.AUTH_CANISTER_ID":     JSON.stringify(env.CANISTER_ID_AUTH     || env.AUTH_CANISTER_ID     || ""),
      "process.env.PAYMENT_CANISTER_ID":  JSON.stringify(env.CANISTER_ID_PAYMENT  || env.PAYMENT_CANISTER_ID  || ""),
      "process.env.MONITORING_CANISTER_ID": JSON.stringify(env.CANISTER_ID_MONITORING || env.MONITORING_CANISTER_ID || ""),
    },
    build: {
      outDir: "dist",
      sourcemap: false,
    },
  };
});
