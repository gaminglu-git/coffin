import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      { source: "/admin/inventory", destination: "/admin/leistungen/lager", permanent: true },
      { source: "/admin/inventory/new", destination: "/admin/leistungen/lager/new", permanent: true },
      { source: "/admin/inventory/:itemId/edit", destination: "/admin/leistungen/lager/:itemId/edit", permanent: true },
      { source: "/admin/inventory/:itemId", destination: "/admin/leistungen/lager/:itemId", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
