import { defineConfig } from "@intentface-launch/core/config";

export default defineConfig({
  // The product this folder lives in: videos can import its components and data
  // with the product's own paths ("@/…"), and its public folder is served.
  product: { path: "..", public: "public" },
});
