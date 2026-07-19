import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins = [react()];
  try {
    // @ts-ignore
    const m = await import('./.vite-source-tags.js');
    plugins.push(m.sourceTags());
  } catch {}

  // Load env then filter only the prefixes we want. Passing an array to loadEnv isn't supported
  // in some Vite versions, so load everything and filter here to be safe.
  const rawEnv = loadEnv(mode, process.cwd());
  const env = Object.fromEntries(
    Object.entries(rawEnv).filter(([k]) => k.startsWith('VITE_') || k.startsWith('NEXT_PUBLIC_'))
  );

  const processEnvDefines: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    processEnvDefines[`process.env.${key}`] = JSON.stringify(value);
  }

  return {
    plugins,
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: processEnvDefines,
  };
})
