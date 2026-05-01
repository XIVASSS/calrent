/** @type {import('next').NextConfig} */
const nextConfig = {
  // Avoid the browser/CDN holding on to stale HTML/RSC payloads when you bounce
  // between multiple local `next dev` / `next start` ports.
  async headers() {
    return [
      {
        source: "/((?!_next/static|_next/image|favicon.ico).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
