import type { Metadata } from "next";
import { Suspense } from "react";
import Stats from "@/components/stats";
import "./globals.css";

export const metadata: Metadata = {
  title: "NERO — Workout",
  description: "Planifiez vos entraînements et suivez votre progression avec NERO.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased font-sans dark"
    >
      <body>
        {children}

        <Suspense fallback={null}>
          <Stats />
        </Suspense>
      </body>
    </html>
  );
}
