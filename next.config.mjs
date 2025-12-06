/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/open-spec-hub/demo',
  assetPrefix: '/open-spec-hub/demo/',
  trailingSlash: false,
};

export default nextConfig;
