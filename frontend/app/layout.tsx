import type { Metadata } from "next";
import "./globals.css";

import { AppLayout } from "@/components/app-layout";

export const metadata: Metadata = {
  title: "PulseNoShow AI — Hospital & Clinic Triage Dashboard",
  description: "AI-powered appointment no-show risk prediction, SHAP explainability, and patient triage system.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
