/** @type {import('next').NextConfig} */
const backendOrigin = process.env.BACKEND_URL || "http://127.0.0.1:5001";

const nextConfig = {
  reactStrictMode: true,
  basePath: "/scoring",
  images: {
    domains: ["geventsunlimited.com"],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
