import "../../styles/globals.css";
import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";
import { SCHOOL_FULL_NAME } from "@/lib/constants";

const fontSans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const fontSerif = Lora({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: `${SCHOOL_FULL_NAME} — Online Exam`,
  description: "Exam creation and proctoring system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fontSans.variable} ${fontSerif.variable}`}>
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        <Providers>
          {children}
          <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        </Providers>
      </body>
    </html>
  );
}
