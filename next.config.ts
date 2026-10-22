import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.holydeen.com";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          "**/.next/**",
          "**/node_modules/**",
          "**/Archive.zip",
          "**/.DS_Store",
        ],
      };
    }
    return config;
  },
  async redirects() {
    return [
      // Old landing-page links: /?landingPageId=12 -> /landing-page/12
      {
        source: "/",
        has: [{ type: "query", key: "landingPageId", value: "(?<landingPageId>.+)" }],
        destination: "/landing-page/:landingPageId",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return {
      // Category links stay /?menu=...; serve them from the dynamic /category
      // page so the plain home page can be statically cached (ISR).
      beforeFiles: [
        {
          source: "/",
          has: [{ type: "query", key: "menu" }],
          destination: "/category",
        },
      ],
      afterFiles: [
        {
          source: "/api/v1/:path*",
          destination: `${API_URL}/api/v1/:path*`,
        },
        {
          source: "/images/:path*",
          destination: `${API_URL}/images/:path*`,
        },
      ],
      fallback: [],
    };
  },

  images: {
    // Cache resized images for 30 days instead of 4 hours, so each image/size
    // is optimized on this server about once a month (Cloudinary images skip
    // the optimizer entirely, see src/components/AppImage.tsx).
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "apireact.digitalever.com.bd",
        pathname: "/images/**",
      },

      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
