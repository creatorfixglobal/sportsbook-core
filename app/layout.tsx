import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata={title:"Sportsbook Core",description:"Sports-only sportsbook platform foundation"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}