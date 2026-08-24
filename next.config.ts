import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  typedRoutes: true,

  /**
   * O playground só existe em development. A página também chama `notFound()`
   * quando NODE_ENV é production — dois mecanismos independentes, porque a
   * rota interna não deve depender de um único guard.
   */
  async redirects() {
    if (!isProduction) return [];
    return [
      { source: "/dev/:path*", destination: "/dashboard", permanent: false },
    ];
  },
};

export default nextConfig;
