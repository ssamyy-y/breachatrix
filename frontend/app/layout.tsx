import "../styles/globals.css";

export const metadata = {
  title: "Breach@Trix",
  description: "Cyber Arena",
  icons: {
    icon: "/internet.png", // 👈 put this in /public
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}