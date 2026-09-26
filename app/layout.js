import "./globals.css";

export const metadata = {
  title: "Song Finder",
  description: "Identify music from a short recording",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
