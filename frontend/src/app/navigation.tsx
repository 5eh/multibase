"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

const Navigation = () => {
  const [scrolled, setScrolled] = useState(false);

  // Add scroll listener to add background on scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`w-full fixed top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-black/80 backdrop-blur-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/"
              className="text-xl font-bold text-white tracking-wider hover:text-gray-300 transition duration-300"
            >
              MultiBase
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <Link
              href="/"
              className="text-white hover:text-gray-300 transition duration-300 font-medium"
            >
              Home
            </Link>

            <Link
              href="/analysis"
              className="text-white border-b-2 border-transparent hover:border-white transition-all duration-300 font-medium px-1"
            >
              Analysis
            </Link>

            <Link
              href="/articles"
              className="text-white border-b-2 border-transparent hover:border-white transition-all duration-300 font-medium px-1"
            >
              Articles
            </Link>

            <Link
              href="/lyrics"
              className="text-white border-b-2 border-transparent hover:border-white transition-all duration-300 font-medium px-1"
            >
              Lyrics
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
