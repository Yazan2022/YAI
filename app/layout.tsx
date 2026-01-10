
import React from "react";
import "./globals.css";

export const metadata = {
  title: "YAI Beta",
  description: "Your personal AI space by Yazan"
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{props.children}</body>
    </html>
  );
}
