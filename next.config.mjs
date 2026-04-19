/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      "/api/clients": ["./data/**/*"],
      "/api/blocks": ["./data/**/*"],
      "/api/newsletters": ["./data/**/*"],
    },
  },
};

export default nextConfig;
