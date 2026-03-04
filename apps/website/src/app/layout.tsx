import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mosaed | AI Receptionist for Clinics",
  description: "Your clinic's AI receptionist. 24/7 call answering and appointment booking.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const locale = headersList.get("x-locale") ?? "ar";
  const isRtl = locale === "ar";
  const lang = locale === "ar" ? "ar" : "en";
  const dir = isRtl ? "rtl" : "ltr";

  return (
    <html lang={lang} dir={dir}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
