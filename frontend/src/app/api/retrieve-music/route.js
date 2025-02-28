// File: /app/api/retrieve-music/route.js
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    // Get the directory path for the music files
    const musicDir = path.join(process.cwd(), "public", "music");

    // Read the directory contents
    const files = await fs.readdir(musicDir);

    // Filter to only include MP3 files and format the response
    const mp3Files = files
      .filter((file) => file.toLowerCase().endsWith(".mp3"))
      .map((filename) => ({
        filename,
        // You could read lyrics from a corresponding file if needed
        lyrics: "",
      }));

    // Return the list of MP3 files
    return NextResponse.json(mp3Files);
  } catch (error) {
    console.error("Error fetching music files:", error);
    return NextResponse.json(
      { error: "Failed to retrieve music files" },
      { status: 500 },
    );
  }
}
