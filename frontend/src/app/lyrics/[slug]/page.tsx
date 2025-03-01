"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface MatchingFile {
  filename: string;
}

interface ApiResponseData {
  content?: string;
  error?: string;
}

export default function ArticlePage() {
  const params = useParams();
  const [slug, setSlug] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    console.log("Component mounted with params:", params);

    const extractSlug = (): string | null => {
      if (!params || !("slug" in params)) return null;
      const slugParam = params.slug;

      if (typeof slugParam === "string") return slugParam;

      if (typeof slugParam === "object" && slugParam !== null) {
        return Object.values(slugParam).join("/");
      }

      return null;
    };

    const extractedSlug = extractSlug();
    console.log(
      "Extracted slug from params:",
      extractedSlug,
      "type:",
      typeof extractedSlug,
    );
    setSlug(extractedSlug);
  }, [params]);

  useEffect(() => {
    if (!slug) return;

    async function findMatchingPdf() {
      if (!slug) {
        console.log("Cannot search for PDF: slug is null");
        return;
      }

      try {
        const response = await fetch(
          `/api/retrieve-lyrics-pdf?slug=${encodeURIComponent(slug)}`,
        );

        if (response.ok) {
          const data = await response.json();
          if (data.pdfUrl) {
            setPdfUrl(data.pdfUrl);
            console.log("Found matching PDF:", data.pdfUrl);
          } else {
            console.log("No matching PDF found for:", slug);
          }
        }
      } catch (error) {
        console.error("Error finding matching PDF:", error);
      }
    }

    findMatchingPdf();
  }, [slug]);

  useEffect(() => {
    console.log("Slug state updated:", slug);

    async function fetchArticleContent() {
      if (!slug) {
        console.log("Slug parameter is missing or empty");
        setError("Please provide an article name in the URL");
        setLoading(false);
        return;
      }

      try {
        console.log("Attempting to fetch article with slug:", slug);

        // Direct API call with the slug as a query parameter
        const apiUrl = `/api/retrieve-lyrics?slug=${encodeURIComponent(slug)}`;
        console.log("Calling API at:", apiUrl);

        const response = await fetch(apiUrl);
        console.log("API response status:", response.status);

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data: ApiResponseData | MatchingFile[] = await response.json();
        console.log("API response data:", data);

        // Type guard to check if it's an error response
        if (data && "error" in data) {
          throw new Error(data.error);
        }

        // Check if we got direct content from the API
        if (data && "content" in data && data.content) {
          console.log("Received direct content from API");
          setContent(data.content);
          setLoading(false);
          return;
        }

        // If we got a list of files, find the matching one
        if (Array.isArray(data)) {
          console.log("Received file list. Searching for matching file...");

          const matchingFile = data.find((file: MatchingFile) => {
            // Remove .md extension for comparison
            const fileNameWithoutExt = file.filename.replace(".md", "");
            return (
              fileNameWithoutExt === slug || fileNameWithoutExt.includes(slug)
            );
          });

          if (!matchingFile) {
            console.log(`No markdown file found for slug: ${slug}`);
            throw new Error(`Article not found: ${slug}`);
          }

          console.log(`Found matching markdown file: ${matchingFile.filename}`);

          // Fetch the actual markdown content
          try {
            const contentUrl = `/lyrics/${matchingFile.filename}`;
            console.log("Fetching content from:", contentUrl);

            const contentResponse = await fetch(contentUrl);
            console.log("Content response status:", contentResponse.status);

            if (!contentResponse.ok) {
              console.error(
                `Failed to fetch markdown content. Status: ${contentResponse.status}`,
              );

              if (contentResponse.status === 404) {
                throw new Error(
                  `Article file not found. Make sure ${matchingFile.filename} exists in the public/lyrics folder.`,
                );
              } else {
                throw new Error(
                  `Failed to fetch markdown content: ${contentResponse.status}`,
                );
              }
            }

            const markdownContent = await contentResponse.text();
            console.log("Successfully loaded markdown content");
            setContent(markdownContent);
          } catch (contentError) {
            console.error("Error fetching markdown content:", contentError);
            setError(
              `Failed to load article content: ${(contentError as Error).message}`,
            );
          }
        } else {
          console.error("Unexpected API response format:", data);
          throw new Error("Unexpected response from API");
        }
      } catch (err) {
        console.error("Error in article loading process:", err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchArticleContent();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto mt-12">
        <div className="animate-pulse text-center">Loading article...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-3xl mx-auto mt-12">
        <div className="bg-red-900 bg-opacity-20 border border-red-800 rounded p-4 text-center">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-red-300">{error}</p>
          <div className="mt-4">
            <pre className="text-xs text-left bg-black bg-opacity-30 p-2 rounded overflow-auto">
              Debug: slug {slug}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  const formatTitle = (slug: string | null): string => {
    if (!slug) return "Article";

    const words = slug.split("_").filter((word) => word !== "music"); // Remove 'music'

    return words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
      .replace(/(\d{4})/, " ($1)");
  };

  return (
    <div className="p-8 max-w-3xl mx-auto mt-12">
      <h1 className="text-3xl font-bold mb-6 text-center">Lyrics</h1>

      <h1 className="text-3xl font-bold mb-6 text-center">
        {formatTitle(slug)}
      </h1>

      <div className="mb-6 text-center">
        {pdfUrl ? (
          <a
            href={pdfUrl}
            download
            className="inline-block bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors hover:bg-blue-600 mr-4 flex items-center justify-center mx-auto w-48"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download PDF Version
          </a>
        ) : (
          <button
            className="inline-block bg-gray-600 text-gray-300 font-medium py-2 px-6 rounded-lg cursor-not-allowed opacity-70 flex items-center justify-center mx-auto w-48"
            disabled
            title="No PDF version available"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
            No PDF Available
          </button>
        )}
      </div>

      <div className="prose prose-invert max-w-none">
        {/* For a production app, you would use a markdown renderer here */}
        <pre className="whitespace-pre-wrap bg-gray-800 p-4 rounded-lg text-sm">
          {content}
        </pre>
      </div>
      <div className="mt-8 text-center">
        <Link
          href="/"
          className="inline-block bg-white text-black font-medium py-2 px-6 rounded-lg transition-colors hover:bg-gray-200"
        >
          Back to Timeline
        </Link>
      </div>
    </div>
  );
}
