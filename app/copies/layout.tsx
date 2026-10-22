import type { Metadata } from "next"

export const metadata: Metadata = { title: "My copies" }

export default function CopiesLayout({ children }: { children: React.ReactNode }) {
  return children
}
