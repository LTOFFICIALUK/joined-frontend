import type { NextConfig } from "next"

const config: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.joined.fun" }],
        destination: "https://joined.fun/:path*",
        permanent: true,
      },
      { source: "/copies", destination: "/portfolio", permanent: false },
      { source: "/positions", destination: "/portfolio", permanent: false },
      { source: "/funds", destination: "/portfolio", permanent: false },
    ]
  },
}

export default config
