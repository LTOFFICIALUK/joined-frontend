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
    ]
  },
}

export default config
