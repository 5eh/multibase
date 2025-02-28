"use client";

import { useState, useEffect } from "react";
import Visual from "./visual";

const Page = () => {
  // Music player state
  const [musicFiles, setMusicFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);

  // Fetch music files on component mount
  useEffect(() => {
    async function fetchMusicFiles() {
      try {
        setLoading(true);
        const response = await fetch("/api/retrieve-music");

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log("Retrieved music files:", data);

        // Sort files by creation date extracted from filename
        const sortedFiles = [...data].sort((a, b) => {
          const dateA = extractDateFromFilename(a.filename);
          const dateB = extractDateFromFilename(b.filename);
          return dateA - dateB;
        });

        setMusicFiles(sortedFiles);

        // If we have files, set the current song to the first one
        if (sortedFiles.length > 0) {
          setCurrentSong(sortedFiles[0]);
        }
      } catch (err) {
        console.error("Error fetching music files:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMusicFiles();
  }, []);

  // Handle audio being ready
  const handleAudioReady = () => {
    setIsAudioReady(true);
  };

  // Helper function to extract date from filename
  const extractDateFromFilename = (filename) => {
    const parts = filename.split("_");
    if (parts.length >= 3) {
      const month = parts[1].toLowerCase();
      const year = parseInt(parts[2], 10);

      const months = {
        january: 0,
        february: 1,
        march: 2,
        april: 3,
        may: 4,
        june: 5,
        july: 6,
        august: 7,
        september: 8,
        october: 9,
        november: 10,
        december: 11,
      };

      const monthIndex = months[month] || 0;
      return new Date(year, monthIndex, 1);
    }
    return new Date(0); // Default date if format doesn't match
  };

  // Parse filename to extract information
  const parseFilename = (filename) => {
    const parts = filename.split("_");
    if (parts.length >= 4) {
      const title = parts[0].replaceAll("-", " ");
      const month = parts[1];
      const year = parts[2];

      return {
        title: title.charAt(0).toUpperCase() + title.slice(1),
        date: `${month} ${year}`,
        detailsUrl: `/${filename.replace(".mp3", "")}`,
      };
    }
    return { title: filename, date: "Unknown", detailsUrl: "/" };
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    if (isAudioReady) {
      setIsPlaying(!isPlaying);
    }
  };

  // Handle selecting a song
  const handleSongSelect = (index) => {
    if (currentIndex === index) {
      // If clicking the same song, just toggle play/pause
      togglePlayPause();
      return;
    }

    setIsPlaying(false);
    setIsAudioReady(false);
    setCurrentIndex(index);
    setCurrentSong(musicFiles[index]);
  };

  // Handle slider change
  const handleSliderChange = (e) => {
    const index = parseInt(e.target.value, 10);
    handleSongSelect(index);
  };

  // Get current song URL
  const getCurrentSongUrl = () => {
    if (!currentSong) return "";
    return `/music/${currentSong.filename}`;
  };

  return (
    <div className="w-full min-h-screen pt-24 px-6 text-white">
      <h1 className="text-2xl font-bold mb-6 text-center">Music Timeline</h1>

      {loading ? (
        <div className="text-center text-2xl py-12">Loading music files...</div>
      ) : error ? (
        <div className="text-center text-red-400 py-12">Error: {error}</div>
      ) : musicFiles.length === 0 ? (
        <div className="text-center text-2xl py-12">No music files found</div>
      ) : (
        <>
          {/* Three.js Visualization Component */}
          <div className="mb-8">
            {currentSong && (
              <Visual
                audioUrl={getCurrentSongUrl()}
                isPlaying={isPlaying}
                onAudioReady={handleAudioReady}
              />
            )}
          </div>

          {/* Current Player */}
          {currentSong && (
            <div className="p-6 mb-8 border border-gray-700 rounded-lg bg-black bg-opacity-30">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">
                  {parseFilename(currentSong.filename).title}
                </h2>
                <span className="text-gray-300">
                  {parseFilename(currentSong.filename).date}
                </span>
              </div>

              {/* Custom Player Controls */}
              <div className="flex items-center justify-center mb-6">
                <button
                  onClick={togglePlayPause}
                  disabled={!isAudioReady}
                  className={`${
                    isAudioReady
                      ? "bg-white text-black hover:bg-gray-200"
                      : "bg-gray-600 text-gray-400"
                  } p-4 rounded-full transition-colors`}
                >
                  {isPlaying ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="6" y="4" width="4" height="16"></rect>
                      <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  )}
                </button>
              </div>

              {!isAudioReady && (
                <div className="text-center text-gray-400 mb-4">
                  Loading audio...
                </div>
              )}
            </div>
          )}

          {/* Timeline Slider */}
          <div className="mb-8">
            <div className="mb-4 flex justify-between text-sm text-gray-300">
              <span>Earliest</span>
              <span>Latest</span>
            </div>
            <input
              type="range"
              min="0"
              max={musicFiles.length - 1}
              value={currentIndex}
              onChange={handleSliderChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{
                background:
                  "linear-gradient(to right, white 0%, white " +
                  (currentIndex / (musicFiles.length - 1)) * 100 +
                  "%, #4a4a4a " +
                  (currentIndex / (musicFiles.length - 1)) * 100 +
                  "%, #4a4a4a 100%)",
              }}
            />
            <div className="flex justify-between mt-4">
              <span className="text-sm text-gray-300">
                {musicFiles.length > 0
                  ? parseFilename(musicFiles[0].filename).date
                  : ""}
              </span>
              <span className="text-sm text-gray-300">
                {musicFiles.length > 0
                  ? parseFilename(musicFiles[musicFiles.length - 1].filename)
                      .date
                  : ""}
              </span>
            </div>
          </div>

          {/* View Details Button */}
          {currentSong && (
            <div className="text-center py-8">
              <a
                href={parseFilename(currentSong.filename).detailsUrl}
                className="inline-block bg-white text-black font-medium py-3 px-8 rounded-lg transition-colors hover:bg-gray-200"
              >
                View More Details
              </a>
            </div>
          )}

          {/* All Music Files List */}
          <div className="mb-8 border border-gray-700 p-4 bg-black bg-opacity-30 rounded-lg">
            <h2 className="font-bold mb-4 text-xl">All Available Music:</h2>
            <div className="max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-black">
              <ul className="space-y-2">
                {musicFiles.map((file, index) => (
                  <li
                    key={index}
                    className={`p-3 cursor-pointer border-b border-gray-700 hover:bg-gray-800 transition-colors ${
                      currentIndex === index
                        ? "bg-gray-800 border-l-4 border-l-white pl-2"
                        : ""
                    }`}
                    onClick={() => handleSongSelect(index)}
                  >
                    {parseFilename(file.filename).title} -{" "}
                    {parseFilename(file.filename).date}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Page;
