import { existsSync, readFileSync } from "fs";
import { join } from "path";

export type ProjectContext = {
  name: string | null;
  description: string | null;
  stack: string[];
};

const FRAMEWORK_DEPS: Record<string, string> = {
  next: "Next.js",
  react: "React",
  vue: "Vue",
  svelte: "Svelte",
  "solid-js": "SolidJS",
  express: "Express",
  fastify: "Fastify",
  hono: "Hono",
  tailwindcss: "Tailwind",
  prisma: "Prisma",
  drizzle: "Drizzle",
  "drizzle-orm": "Drizzle",
  firebase: "Firebase",
  supabase: "Supabase",
  stripe: "Stripe",
  openai: "OpenAI",
  "@anthropic-ai/sdk": "Anthropic",
  langchain: "LangChain",
  tensorflow: "TensorFlow",
  pytorch: "PyTorch",
  electron: "Electron",
  tauri: "Tauri",
  "react-native": "React Native",
  expo: "Expo",
  typescript: "TypeScript",
  graphql: "GraphQL",
  trpc: "tRPC",
  "@trpc/server": "tRPC",
  vite: "Vite",
  turbo: "Turborepo",
  docker: "Docker",
  redis: "Redis",
  ioredis: "Redis",
  mongoose: "MongoDB",
  pg: "PostgreSQL",
};

export function gatherProject(cwd: string): ProjectContext {
  const pkgPath = join(cwd, "package.json");
  if (!existsSync(pkgPath)) {
    return { name: null, description: null, stack: [] };
  }

  try {
    const raw = readFileSync(pkgPath, "utf-8");
    const pkg = JSON.parse(raw);

    const name = pkg.name || null;
    const description = pkg.description || null;

    // Detect stack from dependencies
    const allDeps = {
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {}),
    };

    const stack: string[] = [];
    for (const [dep, label] of Object.entries(FRAMEWORK_DEPS)) {
      if (dep in allDeps) {
        stack.push(label);
      }
    }

    return { name, description, stack: [...new Set(stack)] };
  } catch {
    return { name: null, description: null, stack: [] };
  }
}
