import "./global.css";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { ReactNode } from "react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=IM+Fell+English:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Roboto:ital,wght@0,300;0,400;0,500;0,700;1,400&display=swap"
          rel="stylesheet"
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `@font-face{font-family:'Tiamat Condensed SC';src:url('${basePath}/fonts/assets_TiamatCondensedSC-Regular.woff2') format('woff2'),url('${basePath}/fonts/assets_TiamatCondensedSC-Regular.woff') format('woff'),url('${basePath}/fonts/assets_TiamatCondensedSC-Regular.ttf') format('truetype');font-weight:400 700;font-style:normal;font-display:swap;}`,
          }}
        />
      </head>
      <body className="flex flex-col min-h-screen">
        <RootProvider
          search={{ enabled: false }}
          theme={{
            attribute: ["class", "data-theme"],
            themes: ["light", "dark", "high-contrast"],
            defaultTheme: "system",
            enableSystem: true,
          }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
