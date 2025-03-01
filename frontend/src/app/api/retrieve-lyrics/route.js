// File: /app/api/retrieve-music/route.js
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(request) {
  try {
    // Get the directory path for the lyrics files
    const lyricsDir = path.join(process.cwd(), "public", "lyrics");

    // Check if directory exists
    try {
      await fs.access(lyricsDir);
      console.log(`Directory ${lyricsDir} exists and is accessible`);
    } catch (error) {
      console.error(
        `Directory ${lyricsDir} does not exist or is not accessible:`,
        error,
      );
      return NextResponse.json(
        { error: "Lyrics directory not found" },
        { status: 404 },
      );
    }

    // Get slug from URL if provided
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug");

    // Read the directory contents
    const files = await fs.readdir(lyricsDir);
    console.log("Files found in directory:", files);

    // Filter to only include markdown files
    const markdownFiles = files.filter((file) =>
      file.toLowerCase().endsWith(".md")
    );
    console.log("Markdown files found:", markdownFiles);

    // If slug is provided, try to find a specific file
    if (slug) {
      console.log(`Looking for file matching slug: ${slug}`);

      // Try exact match first
      const exactMatch = markdownFiles.find((file) =>
        file === `${slug}.md` || file.replace(".md", "") === slug
      );

      // Then try partial match
      const partialMatch = !exactMatch
        ? markdownFiles.find((file) =>
          file.toLowerCase().includes(slug.toLowerCase())
        )
        : null;

      const matchedFile = exactMatch || partialMatch;

      if (matchedFile) {
        console.log(`Found matching file: ${matchedFile}`);

        try {
          // Try to read the file content
          const content = await fs.readFile(
            path.join(lyricsDir, matchedFile),
            "utf-8",
          );
          console.log(`Successfully read file content for ${matchedFile}`);

          return NextResponse.json({
            success: true,
            filename: matchedFile,
            content,
          });
        } catch (readError) {
          console.error(`Error reading file ${matchedFile}:`, readError);
          return NextResponse.json(
            { error: `File found but could not be read: ${readError.message}` },
            { status: 500 },
          );
        }
      } else {
        console.log(`No file found matching slug: ${slug}`);
        return NextResponse.json(
          { error: `No markdown file found matching: ${slug}` },
          { status: 404 },
        );
      }
    }

    // If no slug or no match found, return all files
    const result = markdownFiles.map((filename) => ({
      filename,
      content: "", // Don't include content for listing
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { error: `Failed to process request: ${error.message}` },
      { status: 500 },
    );
  }
}
