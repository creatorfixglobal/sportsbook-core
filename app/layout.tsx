import type { Metadata } from "next";
import "./globals.css";
import { BottomNav } from "./BottomNav";
export const metadata: Metadata={title:"Sportsbook Core",description:"Sports market learning and demonstration platform"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}<BottomNav/></body></html>}