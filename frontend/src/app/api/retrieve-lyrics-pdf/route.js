// app/api/retrieve-lyrics-pdf/route.js
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET(request) {
  try {
    // Get the slug parameter from the request
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "Missing slug parameter" },
        { status: 400 },
      );
    }

    // Define the lyrics directory path - this should be in your public folder
    const lyricsDir = path.join(process.cwd(), "public", "lyrics");

    try {
      // Read all files in the lyrics directory
      const files = await fs.readdir(lyricsDir);

      // Filter PDF files
      const pdfFiles = files.filter((file) =>
        file.toLowerCase().endsWith(".pdf")
      );

      // For this specific naming pattern: kusama_november_2019_music.pdf
      // Extract the components from the slug
      const slugParts = slug.split("_");

      // Look for PDF files that match the pattern
      let matchedPdf = null;

      // Check if slug has enough parts to match
      if (slugParts.length >= 3) {
        // Get name, month, year components
        const [name, month, year] = slugParts;

        // Try exact match with the pattern: name_month_year_music.pdf
        const expectedFilename = `${name}_${month}_${year}_music.pdf`;
        matchedPdf = pdfFiles.find((file) => file === expectedFilename);

        // If no exact match, try more flexible matching
        if (!matchedPdf) {
          matchedPdf = pdfFiles.find((file) => {
            // Check if file contains all the key components
            return (
              file.includes(name) &&
              file.includes(month) &&
              file.includes(year) &&
              file.toLowerCase().includes("music") &&
              file.toLowerCase().endsWith(".pdf")
            );
          });
        }

        // If still no match, try without requiring "music" in the filename
        if (!matchedPdf) {
          matchedPdf = pdfFiles.find((file) => {
            return (
              file.includes(name) &&
              file.includes(month) &&
              file.includes(year) &&
              file.toLowerCase().endsWith(".pdf")
            );
          });
        }
      }

      if (matchedPdf) {
        // Return the URL for the PDF file
        const pdfUrl = `/lyrics/${matchedPdf}`;
        return NextResponse.json({ pdfUrl });
      } else {
        // No matching PDF found
        return NextResponse.json({ message: "No matching PDF found" });
      }
    } catch (error) {
      console.error("Error reading lyrics directory:", error);
      return NextResponse.json(
        { error: "Failed to read lyrics directory" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
