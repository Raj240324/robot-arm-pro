/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Strict mode catches subtle React issues in development.
   * Disable if you observe double-effect calls causing duplicate frame loads
   * (they're cleaned up properly, but may add noise to the dev console).
   */
  reactStrictMode: true,

  /**
   * Serve WebP frames from /public/hero-frames/ with aggressive caching
   * headers so repeat visits skip the network entirely.
   */
  async headers() {
    return [
      {
        source: "/hero-frames/:path*",
        headers: [
          {
            key: "Cache-Control",
            // Immutable: frames never change once built, so browsers can cache
            // them for a full year without revalidation.
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;