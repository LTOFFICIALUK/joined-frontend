import type { Metadata, Viewport } from "next"
import { JetBrains_Mono, Sora, Unbounded } from "next/font/google"
import { BRAND } from "@/lib/config"
import { Frame } from "@/components/shell/Frame"
import { Providers } from "./providers"
import "./globals.css"

const display = Unbounded({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-display",
})

const sans = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sora",
})

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-mono",
})

const title = "joined. One trader. Everyone joins in."

export const metadata: Metadata = {
  title: { default: title, template: "joined: %s" },
  description: BRAND.description,
  applicationName: "joined",
  metadataBase: new URL(BRAND.url),
  alternates: { canonical: BRAND.url },
  icons: {
    icon: [{ url: "/brand/joined-pfp.png", type: "image/png" }],
    apple: [{ url: "/brand/joined-pfp.png" }],
  },
  openGraph: {
    title,
    description: BRAND.description,
    url: BRAND.url,
    siteName: "joined",
    type: "website",
    images: [{ url: "/brand/joined-og.png", width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: BRAND.description,
    images: ["/brand/joined-og.png"],
  },
}

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable} ${mono.variable} font-sans antialiased`}>
        <Providers><Frame>{children}</Frame></Providers>
      </body>
    </html>
  )
}
