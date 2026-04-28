import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      // Mirror the `@/*` path alias from tsconfig.json so Vitest resolves
      // imports like `import { ... } from "@/lib/..."` correctly.
      "@": path.resolve(__dirname),
    },
  },
});
