/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@pexjet/ui",
    "@pexjet/lib",
    "@pexjet/types",
    "@pexjet/database",
  ],
  images: {
    domains: ["res.cloudinary.com"],
  },
  webpack: (config) => {
    // Fix for react-hook-form module resolution in monorepo
    config.resolve.alias = {
      ...config.resolve.alias,
      "react-hook-form": require.resolve("react-hook-form"),
    };
    return config;
  },
};

module.exports = nextConfig;
