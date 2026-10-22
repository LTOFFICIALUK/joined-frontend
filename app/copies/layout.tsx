import type { Metadata } from "next"

export const metadata: Metadata = { title: { absolute: "joined: My copies" } }

export default function CopiesLayout({ children }: { children: React.ReactNode }) {
  return children
}
