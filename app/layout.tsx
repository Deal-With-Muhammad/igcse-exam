import "@/styles/globals.css";
import type { Metadata } from "next";
import { Providers } from "./providers";
import { fontSans } from "@/config/fonts";
import clsx from "clsx";
// import { ToastProvider } from "@/components/toast-provider";

export const metadata: Metadata = {
  title: "ELS ICT EXAM",
  description: "Developed by Muhammad Ahmad",
  icons: {
    // Path to your favicon relative to the public directory
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={clsx("font-sans antialiased", fontSans.className)}>
        <Providers>
          {children}
          {/* <ToastProvider /> */}
        </Providers>
      </body>
    </html>
  );
}
