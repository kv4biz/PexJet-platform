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
  experimental: {
    // Mark pdfkit as external to prevent bundling issues with AFM font files
    serverComponentsExternalPackages: ["pdfkit"],
  },
  webpack: (config, { isServer }) => {
    // Fix for react-hook-form module resolution in monorepo
    config.resolve.alias = {
      ...config.resolve.alias,
      "react-hook-form": require.resolve("react-hook-form"),
    };

    // Ensure pdfkit data files are accessible
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        pdfkit: "commonjs pdfkit",
      });
    }

    return config;
  },
};

module.exports = nextConfig;
