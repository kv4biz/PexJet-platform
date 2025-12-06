/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@pexjet/ui",
    "@pexjet/database",
    "@pexjet/lib",
    "@pexjet/types",
  ],
  images: {
    domains: ["res.cloudinary.com"],
  },
};

module.exports = nextConfig;
