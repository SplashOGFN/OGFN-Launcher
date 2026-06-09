import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import WindowBar from "@/components/layout/WindowBar";
import RpcProvider from "@/components/providers/RpcProvider";
import ConnectionMonitor from "@/components/providers/ConnectionMonitor";

const font = Rubik({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Splash Launcher",
  description: "Splash - A Fortnite Private Server Launcher",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${font.className} antialiased bg-fixed bg-gradient-to-bl from-[#05070a] to-[#080a0f] text-white`}
      >
        <WindowBar />
        <RpcProvider />
        <ConnectionMonitor />
        {children}
      </body>
    </html>
  );
}
