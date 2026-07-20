import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins = [react()];

  // Load optional source tags plugin
  try {
    const m = await import('./.vite-source-tags.js');
    if (m.sourceTags) {
      plugins.push(m.sourceTags());
    }
  } catch {
    // Source tags plugin not found or failed to load - continue without it
  }

  // Load and filter environment variables
  // We filter to only VITE_ and NEXT_PUBLIC_ prefixes for security and clarity
  const rawEnv = loadEnv(mode, process.cwd());
  const env = Object.fromEntries(
    Object.entries(rawEnv).filter(([k]) => k.startsWith('VITE_') || k.startsWith('NEXT_PUBLIC_'))
  );

  // Provide a full process.env object for code that expects it at runtime
  const processEnv = {
    NODE_ENV: mode,
    ...env,
  };

  // Create define object with both full process.env and granular replacements for compatibility
  const processEnvDefines: Record<string, string> = {
    'process.env': JSON.stringify(processEnv),
    ...Object.fromEntries(
      Object.entries(env).map(([key, value]) => [
        `process.env.${key}`,
        JSON.stringify(value),
      ])
    ),
  };

  return {
    plugins,
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: processEnvDefines,
  };
})
