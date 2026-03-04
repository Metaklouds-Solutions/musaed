import type { Metadata } from "next";
import {
  Amiri,
  Playfair_Display,
  Space_Grotesk,
  Tajawal,
} from "next/font/google";
import "../globals.css";

const tajawal = Tajawal({
  variable: "--font-sans-ar",
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans-en",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const amiri = Amiri({
  variable: "--font-accent-ar",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-accent-en",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";

  const title = isAr
    ? "مساعد | موظف الاستقبال الذكي للعيادات"
    : "Mosaed | AI Receptionist for Clinics";
  const description = isAr
    ? "موظف الاستقبال الذكي لعيادتك. رد على الاتصالات على مدار الساعة وحجز المواعيد تلقائياً."
    : "Your clinic's AI receptionist. 24/7 call answering and appointment booking.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      locale: isAr ? "ar_SA" : "en_US",
    },
  };
}

export async function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const lang = isAr ? "ar" : "en";

  return (
    <div
      dir={dir}
      lang={lang}
      className={`${tajawal.variable} ${spaceGrotesk.variable} ${amiri.variable} ${playfairDisplay.variable} min-h-screen`}
    >
      {children}
    </div>
  );
}
