"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import GavinWoodsGif from "/public/gavin_wood.gif";
import Image from "next/image";

interface NavigationProps {
  currentSongUrl?: {
    newsUrl: string;
    lyricsUrl: string;
  } | null;
}

const Navigation: React.FC<NavigationProps> = ({ currentSongUrl }) => {
  const [scrolled, setScrolled] = useState(false);
  console.log(scrolled);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`w-full fixed top-0 z-50 transition-all duration-300 bg-transparent`}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="text-white font-bold text-2xl">
            <div className="logo mt-12">
              <Image
                src={GavinWoodsGif}
                alt="Gavin Woods"
                width={150}
                height={150}
                className="logo-gif"
              />
            </div>
          </Link>
          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <Link
              href="/"
              className="text-white hover:text-gray-300 transition duration-300 font-medium"
            >
              Home
            </Link>
            <Link
              href={currentSongUrl?.newsUrl || "/articles"}
              className="text-white border-b-2 border-transparent hover:border-white transition-all duration-300 font-medium px-1"
            >
              {currentSongUrl?.newsUrl ? "View News" : "Articles"}
            </Link>
            <Link
              href={currentSongUrl?.lyricsUrl || "/lyrics"}
              className="text-white border-b-2 border-transparent hover:border-white transition-all duration-300 font-medium px-1"
            >
              {currentSongUrl?.lyricsUrl ? "View Lyrics" : "Lyrics"}
            </Link>
            <Link
              href="/generate"
              className="ml-2 bg-transparent hover:bg-white text-white hover:text-black border border-white rounded px-4 py-1.5 transition-all duration-300 font-medium"
            >
              Generate
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
