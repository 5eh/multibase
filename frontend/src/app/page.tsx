"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import Visual from "./components/visual";
import Navigation from "./components/navigation";

interface MusicFile {
  filename: string;
}

interface ParsedFileInfo {
  title: string;
  date: string;
  detailsUrl: string;
}

const Page = () => {
  // Music files state
  const [musicFiles, setMusicFiles] = useState<MusicFile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentSong, setCurrentSong] = useState<MusicFile | null>(null);

  // Audio state and refs
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Fetch music files on component mount
  useEffect(() => {
    async function fetchMusicFiles() {
      try {
        setLoading(true);
        const response = await fetch("/api/retrieve-music");

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = (await response.json()) as MusicFile[];
        console.log("Retrieved music files:", data);

        const sortedFiles = [...data].sort((a, b) => {
          const dateA = extractDateFromFilename(a.filename);
          const dateB = extractDateFromFilename(b.filename);
          return dateA.getTime() - dateB.getTime();
        });

        setMusicFiles(sortedFiles);

        if (sortedFiles.length > 0) {
          setCurrentSong(sortedFiles[0]);
        }
      } catch (err) {
        console.error("Error fetching music files:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchMusicFiles();
  }, []);

  // Set up audio element and analyzer when current song changes
  useEffect(() => {
    if (!currentSong) return;

    // Create audio element
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.src = getCurrentSongUrl();
    audioRef.current = audio;
    setIsAudioReady(false);

    // Set up audio context and analyzer
    // TypeScript definition for WebKit prefixed AudioContext
    interface WebKitWindow extends Window {
      webkitAudioContext: typeof AudioContext;
    }

    // Use standard AudioContext or WebKit prefixed version
    const AudioContextClass = window.AudioContext ||
      (window as unknown as WebKitWindow).webkitAudioContext;

    const audioContext = new AudioContextClass();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    // Connect audio to analyzer
    const source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    // Audio events
    audio.addEventListener("canplaythrough", () => {
      setIsAudioReady(true);
    });

    // Stop any playing audio
    setIsPlaying(false);

    // Cleanup audio
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      audioContext.close();
    };
  }, [currentSong]);

  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Utility functions
  const extractDateFromFilename = (filename: string): Date => {
    const parts = filename.split("_");
    if (parts.length >= 3) {
      const month = parts[1].toLowerCase();
      const year = parseInt(parts[2], 10);

      const months: Record<string, number> = {
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
    return new Date(0);
  };

  const parseFilename = (filename: string): ParsedFileInfo => {
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

  const handleSongSelect = (index: number): void => {
    setCurrentIndex(index);
    setCurrentSong(musicFiles[index]);
  };

  const handleSliderChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const index = parseInt(e.target.value, 10);
    handleSongSelect(index);
  };

  const getCurrentSongUrl = (): string => {
    if (!currentSong) return "";
    return `/music/${currentSong.filename}`;
  };

  const togglePlayPause = () => {
    if (isAudioReady) {
      setIsPlaying(!isPlaying);
    }
  };

  const getCurrentSongUrls = () => {
    if (!currentSong) return null;

    const info = parseFilename(currentSong.filename);
    return {
      newsUrl: `news${info.detailsUrl}`,
      lyricsUrl: `lyrics${info.detailsUrl}`,
    };
  };

  return (
    <div className="w-full min-h-screen pt-24 px-6 text-white">
      {/* Add navigation at the top with dynamic song URLs */}
      <Navigation currentSongUrl={getCurrentSongUrls()} />

      {loading
        ? (
          <div className="text-center text-2xl py-12">
            Loading music files...
          </div>
        )
        : error
        ? <div className="text-center text-red-400 py-12">Error: {error}</div>
        : musicFiles.length === 0
        ? <div className="text-center text-2xl py-12">No music files found</div>
        : (
          <>
            {/* Three.js Visualization Component */}
            <div className="mb-8">
              {currentSong && analyserRef.current && (
                <Visual analyser={analyserRef.current} />
              )}
            </div>

            {/* Audio controls */}
            <div className="mt-12 h-screen z-10 flex justify-center items-center max-w-md mx-auto w-full">
              <button
                onClick={togglePlayPause}
                disabled={!isAudioReady}
                className={`${
                  isAudioReady
                    ? "bg-white/20 text-white hover:bg-white/30"
                    : "bg-gray-600/20 text-gray-400"
                } p-4 rounded-full backdrop-blur-md transition-colors`}
              >
                {isPlaying
                  ? (
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
                  )
                  : (
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

            {!isAudioReady && currentSong && (
              <div className="mt-4 text-white text-center">
                Loading audio...
              </div>
            )}

            {/* Timeline Slider */}
            <div className="mt-12 mb-8">
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
                  background: "linear-gradient(to right, white 0%, white " +
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

            {/* Mobile view buttons (only visible on smaller screens) */}
            {currentSong && (
              <div className="w-fit flex gap-8 md:hidden">
                <div className="text-center py-8">
                  <a
                    href={`news${
                      parseFilename(currentSong.filename).detailsUrl
                    }`}
                    className="inline-block bg-white text-black font-medium py-3 px-8 rounded-lg transition-colors hover:bg-gray-200"
                  >
                    View News
                  </a>
                </div>

                <div className="text-center py-8">
                  <a
                    href={`lyrics${
                      parseFilename(currentSong.filename).detailsUrl
                    }`}
                    className="inline-block bg-white text-black font-medium py-3 px-8 rounded-lg transition-colors hover:bg-gray-200"
                  >
                    View Lyrics
                  </a>
                </div>
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
