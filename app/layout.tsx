import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DamuLink — Stop Wasting Blood. Save Lives.",
  description:
    "Kenya wastes 62,000 screened blood units every year. DamuLink matches expiring units to hospitals that need them — before it is too late.",
  keywords: ["blood bank", "Kenya", "transfusion", "health", "blood matching"],
  openGraph: {
    title: "DamuLink",
    description: "Stop Wasting Blood. Save Lives.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
