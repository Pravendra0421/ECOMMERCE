import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthZustandProvider from "@/providers/AuthZustandProvider";
import { getHeader } from "@/lib/HeaderSection/getHeader";
import { HeaderSection } from "@/core/entities/Header.entity";
import { FooterSection } from "@/core/entities/Footer.entity";
import { getFooter } from "@/lib/FooterSection/getFooter";
import { Toaster } from "react-hot-toast";
import ConditionalHeader from "@/components/ConditionalHeader";
import ConditionalFooter from "@/components/ConditionalFooter";
import Head from "next/head";
import Image from "next/image";
import { getAppSettings } from "@/lib/getAppSettings";
<head></head>;
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | My Next.js App", // '%s' will be replaced by page-specific title
    default: "Welcome to My Next.js App", // Default title for the root route '/'
  },
  description: "A starter Next.js application with authentication.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const header: HeaderSection | null = await getHeader();
  if (!header) {
    throw new Error("Header data is required but was not found.");
  }
  const footer: FooterSection | null = await getFooter();
  if (!footer) {
    throw new Error("Footer data is required but was not found");
  }
  const appSetting = await getAppSettings();
  const {
    googleTagManagerId,
    isMetaPixelEnabled,
    metaPixelId,
    isGoogleAnalyticsEnabled,
  } = appSetting;

  return (
    <html lang="en">
      <Head>
        {googleTagManagerId &&
          isGoogleAnalyticsEnabled && ( // <-- Added isGoogleAnalyticsEnabled condition here
            <script
              dangerouslySetInnerHTML={{
                __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${googleTagManagerId}');
              `,
              }}
            />
          )}
        {isMetaPixelEnabled && !googleTagManagerId && metaPixelId && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${metaPixelId}');
                fbq('track', 'PageView');
              `,
            }}
          />
        )}
      </Head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {googleTagManagerId &&
          isGoogleAnalyticsEnabled && ( // <-- Added isGoogleAnalyticsEnabled condition here
            <noscript>
              <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${googleTagManagerId}`}
                height="0"
                width="0"
                style={{ display: "none", visibility: "hidden" }}
              ></iframe>
            </noscript>
          )}
        {/* Optional: Meta Pixel noscript fallback (only if not using GTM) */}
        {isMetaPixelEnabled && !googleTagManagerId && metaPixelId && (
          <noscript>
            <Image
              src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
              alt="Meta Pixel"
              width={1}
              height={1}
              style={{ display: "none" }}
            />
          </noscript>
        )}
        <AuthZustandProvider>
          <ConditionalHeader header={header} />
          {children}
          <Toaster />
          <ConditionalFooter footer={footer} />
        </AuthZustandProvider>
      </body>
    </html>
  );
}
