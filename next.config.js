/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    tsconfigPath: "tsconfig.next.json",
  },
  experimental: {
    serverActions: {
      bodySizeLimit: `${process.env.MAX_UPLOAD_MB || 25}mb`,
    },
    // Next auto-sizes its build worker pool from the host's reported CPU
    // count, which on shared cPanel hosting can be far higher than the
    // memory quota actually allows. Each worker also falls back to the
    // slower, heavier WASM SWC binary here (the host's glibc is too old
    // for the native one — see package.json's --webpack build scripts),
    // so 10 parallel workers exhausted memory and got SIGABRT'd by the
    // host. Force serial builds instead; slower, but it won't get killed.
    cpus: 1,
  },
};

module.exports = nextConfig;
