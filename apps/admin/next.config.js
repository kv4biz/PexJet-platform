/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@pexjet/ui", "@pexjet/lib", "@pexjet/types", "@pexjet/database"],
  images: {
    domains: ["res.cloudinary.com"],
  },
};

module.exports = nextConfig;
