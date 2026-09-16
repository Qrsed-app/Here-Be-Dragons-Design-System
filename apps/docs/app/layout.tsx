import "./global.css";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { ReactNode } from "react";

// Fonts come from theme/fonts.css (the @hbd/fonts item), bundled by Next — never fetched at runtime.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
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
