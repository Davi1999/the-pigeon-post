// app/layout.tsx

import "./globals.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "The Pigeon Post",
  description: "A simple social media platform, designed for true connection.",
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
        <head>
            <link rel="preconnect" href="https://fonts.googleapis.com"/>
            <link rel="preconnect" href="https://fonts.gstatic.com" />
            <link href="https://fonts.googleapis.com/css2?family=Jacquard+24+Charted&display=swap" rel="stylesheet"/>
        </head>
      <body>
        <main className="pt-6 px-4 sm:px-6 lg:px-8s">
            <h1 className="jacquard-24-charted-regular scroll-m-20 text-center text-9xl pb-12">
                The Pigeon Post
            </h1>
            {children}
        </main>
      </body>
    </html>
  )
}
