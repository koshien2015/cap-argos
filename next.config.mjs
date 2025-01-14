/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  assetPrefix: './',
  webpack: (config) => {
    config.externals.push({
      canvas: 'commonjs canvas',
    });
    return config;
  },
};

export default nextConfig;
