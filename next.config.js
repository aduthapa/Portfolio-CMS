/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    tsconfigPath: "tsconfig.next.json",
  },
  experimental: {
    serverActions: {
      bodySizeLimit: `${process.env.MAX_UPLOAD_MB || 25}mb`,
    },
  },
};

module.exports = nextConfig;
