/**
 * MusicGen Pipeline
 *
 * This script orchestrates the full pipeline:
 * 1. Analyze blockchain transaction data using 00_analysis
 * 2. Loop through each month in the analysis data:
 *    a. Get news about Kusama for the specific month using 01_getNews
 *    b. Generate lyrics based on the news using 02_makeLyrics
 *    c. Create music with the lyrics using 03_createMusic, with style based on transaction volume
 *    d. Generate a thumbnail image for the track using 04_createThumbnail
 */

import * as colors from "jsr:@std/fmt/colors";
import { join } from "jsr:@std/path";
import { parseArgs } from "jsr:@std/cli/parse-args";
import { exists } from "jsr:@std/fs/exists";

// Check for required API keys
const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const APIBOX_API_KEY = Deno.env.get("APIBOX_API_KEY");
const BFL_API_KEY = Deno.env.get("BFL_API_KEY");

// Validate API keys
const missingKeys = [];
if (!PERPLEXITY_API_KEY) missingKeys.push("PERPLEXITY_API_KEY");
if (!OPENAI_API_KEY) missingKeys.push("OPENAI_API_KEY");
if (!APIBOX_API_KEY) missingKeys.push("APIBOX_API_KEY");
if (!BFL_API_KEY) missingKeys.push("BFL_API_KEY");

if (missingKeys.length > 0) {
  console.error(
    colors.red(
      `Error: Missing required environment variables: ${
        missingKeys.join(", ")
      }`,
    ),
  );
  console.error(
    colors.yellow(
      "Please set these environment variables before running the script.",
    ),
  );
  Deno.exit(1);
}

// Parse command line arguments
const args = parseArgs(Deno.args, {
  string: ["month", "year", "model", "title", "process-year"],
  boolean: ["instrumental", "verbose", "skip-analysis", "loop-all-months"],
  alias: {
    m: "month",
    y: "year",
    d: "model",
    t: "title",
    i: "instrumental",
    v: "verbose",
    s: "skip-analysis",
    l: "loop-all-months",
    p: "process-year",
  },
  default: {
    model: "V3_5",
    instrumental: false,
    verbose: false,
    "skip-analysis": false,
    "loop-all-months": false,
  },
});

// Display help message if requested
if (args.help) {
  console.log(colors.cyan(`
Kusama MusicGen Pipeline

Usage:
  deno run -A main.js [options]

Options:
  -m, --month=TEXT         Month to analyze (e.g., "January")
  -y, --year=TEXT          Year to analyze (e.g., "2021")
  -p, --process-year=TEXT  Process all months for a specific year (e.g., "2021")
  -t, --title=TEXT         Music title (default: "Kusama <Month> <Year>")
  -d, --model=TEXT         Music model: V3_5 or V4 (default: V3_5)
  -i, --instrumental       Generate instrumental music without lyrics
  -v, --verbose            Show detailed output
  -s, --skip-analysis      Skip analysis step (use existing analysis.json)
  -l, --loop-all-months    Process all months from analysis data in chronological order
  -h, --help               Show this help message

Required API Keys:
  PERPLEXITY_API_KEY     For news retrieval
  OPENAI_API_KEY         For lyrics generation and thumbnail prompt enhancement
  APIBOX_API_KEY         For music generation
  BFL_API_KEY            For thumbnail generation

Examples:
  deno run -A main.js --month="January" --year="2021"
  deno run -A main.js --process-year="2021"
  deno run -A main.js --loop-all-months
`));
  Deno.exit(0);
}

// Validate month and year if provided
if ((args.month && !args.year) || (!args.month && args.year)) {
  console.error(
    colors.red("Error: Both month and year must be provided together"),
  );
  Deno.exit(1);
}

// Set up paths to the individual scripts
const baseDir = Deno.cwd().endsWith("musicgen")
  ? Deno.cwd()
  : join(Deno.cwd(), "musicgen");
const analysisScript = join(baseDir, "00_analysis", "index.js");
const getNewsScript = join(baseDir, "01_getNews", "index.js");
const makeLyricsScript = join(baseDir, "02_makeLyrics", "index.js");
const createMusicScript = join(baseDir, "03_createMusic", "index.js");
const createThumbnailScript = join(baseDir, "04_createThumbnail", "index.js");

// Update paths for the simplified folder structure
const analysisOutputDir = join(baseDir, "00_analysis", "output");
const analysisJsonPath = join(analysisOutputDir, "analysis.json");
const analysisTypstDir = join(baseDir, "00_analysis", "typst");
const analysisTypstJsonPath = join(analysisTypstDir, "analysis.json");
const analysisPdfPath = join(analysisOutputDir, "report.pdf");

/**
 * Run a command and capture its output
 * @param {string[]} cmd Command and arguments
 * @returns {Promise<string>} Command output
 */
async function runCommand(cmd, options = {}) {
  const verbose = args.verbose;

  if (verbose) {
    console.log(colors.dim(`Running command: ${cmd.join(" ")}`));
  }

  const command = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    stdout: "piped",
    stderr: "piped",
    ...options,
  });

  const { code, stdout, stderr } = await command.output();

  const output = new TextDecoder().decode(stdout);
  const error = new TextDecoder().decode(stderr);

  if (code !== 0) {
    throw new Error(`Command failed with exit code ${code}\n${error}`);
  }

  if (verbose && error) {
    console.log(colors.yellow("Command stderr:"));
    console.log(colors.dim(error));
  }

  return output.trim();
}

/**
 * Process a single month through the pipeline
 * @param {Object} selectedMonth - The month data from analysis
 * @param {Object} analysisData - The full analysis data
 * @param {Object} args - Command line arguments
 * @param {Array<string>} logs - Array to collect log messages
 * @returns {Promise<void>}
 */
async function processMonth(selectedMonth, analysisData, args, logs = []) {
  try {
    const logMessage =
      `🎵 Processing: ${selectedMonth.month} ${selectedMonth.year} 🎵`;
    console.log(
      colors.blue("=================================================="),
    );
    console.log(
      colors.blue(logMessage),
    );
    console.log(
      colors.blue("=================================================="),
    );

    // Add to logs if provided
    if (logs) {
      logs.push(`\n${new Date().toISOString()} - ${logMessage}`);
    }

    // Copy newspaper.pdf for the selected month if it exists
    try {
      const newspaperMonth = selectedMonth.month.toLowerCase();
      const newspaperYear = selectedMonth.year;
      const newspaperPdfPath = join(
        baseDir,
        "01_getNews",
        "output",
        `kusama_${newspaperMonth}_${newspaperYear}_newspaper.pdf`,
      );

      // Use root output directory for PDFs
      const rootOutputDir = join(baseDir, "output");
      await Deno.mkdir(rootOutputDir, { recursive: true });

      if (await exists(newspaperPdfPath)) {
        const rootNewspaperPath = join(
          rootOutputDir,
          `kusama_${newspaperMonth}_${newspaperYear}_newspaper.pdf`,
        );
        await Deno.copyFile(newspaperPdfPath, rootNewspaperPath);
        console.log(
          colors.dim(
            `Copied newspaper.pdf (${newspaperMonth} ${newspaperYear}) to ${rootNewspaperPath}`,
          ),
        );
      }
    } catch (copyNewspaperError) {
      console.log(
        colors.yellow(
          `Note: Could not copy newspaper.pdf for ${selectedMonth.month} ${selectedMonth.year}: ${copyNewspaperError.message}`,
        ),
      );
    }

    console.log(
      colors.dim(
        `Selected month: ${selectedMonth.month} ${selectedMonth.year}`,
      ),
    );
    console.log(colors.dim(`Transaction count: ${selectedMonth.count}`));

    // Check if musicStyle and bpm are defined
    if (!selectedMonth.musicStyle || !selectedMonth.bpm) {
      // Calculate music style based on transaction count
      const maxCount = analysisData.highestMonth.count;
      const minCount = analysisData.lowestMonth.count;
      const countRange = maxCount - minCount;

      // Define music styles if not in the data
      const MUSIC_STYLES = [
        {
          name: "Ambient",
          description: "Slow, atmospheric ambient music",
          minBpm: 60,
          maxBpm: 80,
        },
        {
          name: "Chillout",
          description: "Relaxed electronic music",
          minBpm: 80,
          maxBpm: 100,
        },
        {
          name: "Downtempo",
          description: "Mellow electronic beats",
          minBpm: 90,
          maxBpm: 110,
        },
        {
          name: "Trip Hop",
          description: "Moody, atmospheric beats",
          minBpm: 90,
          maxBpm: 110,
        },
        {
          name: "Lo-Fi",
          description: "Relaxed beats with vinyl crackle",
          minBpm: 70,
          maxBpm: 90,
        },
        {
          name: "Jazz",
          description: "Smooth jazz with piano",
          minBpm: 80,
          maxBpm: 120,
        },
        {
          name: "Folk",
          description: "Acoustic folk music",
          minBpm: 90,
          maxBpm: 120,
        },
        {
          name: "Pop",
          description: "Catchy pop music",
          minBpm: 100,
          maxBpm: 130,
        },
        {
          name: "Indie Rock",
          description: "Alternative rock with indie vibes",
          minBpm: 110,
          maxBpm: 140,
        },
        {
          name: "Rock",
          description: "Energetic rock music",
          minBpm: 120,
          maxBpm: 150,
        },
        {
          name: "Dance",
          description: "Upbeat dance music",
          minBpm: 120,
          maxBpm: 140,
        },
        {
          name: "House",
          description: "Electronic house music",
          minBpm: 120,
          maxBpm: 130,
        },
        {
          name: "Techno",
          description: "Driving electronic beats",
          minBpm: 120,
          maxBpm: 150,
        },
        {
          name: "Drum and Bass",
          description: "Fast-paced electronic music",
          minBpm: 160,
          maxBpm: 180,
        },
        {
          name: "Hardstyle",
          description: "Hard-hitting electronic music",
          minBpm: 150,
          maxBpm: 160,
        },
        {
          name: "Speedcore",
          description: "Extremely fast electronic music",
          minBpm: 180,
          maxBpm: 300,
        },
      ];

      // Calculate normalized count (0 to 1)
      const normalizedCount = (selectedMonth.count - minCount) / countRange;

      // Select style based on normalized count
      const styleIndex = Math.min(
        Math.floor(normalizedCount * MUSIC_STYLES.length),
        MUSIC_STYLES.length - 1,
      );
      const style = MUSIC_STYLES[styleIndex];

      // Calculate BPM
      const bpmRange = style.maxBpm - style.minBpm;
      const bpm = Math.round(style.minBpm + (normalizedCount * bpmRange));

      // Update the selectedMonth object
      selectedMonth.musicStyle = style.name;
      selectedMonth.musicDescription = style.description;
      selectedMonth.bpm = bpm;
    }

    console.log(
      colors.dim(
        `Music style: ${selectedMonth.musicStyle} (${selectedMonth.bpm} BPM)`,
      ),
    );

    // Set title if not provided
    const title = args.title ||
      `Kusama ${selectedMonth.month} ${selectedMonth.year}`;

    // Step 1: Get news about Kusama for the selected month
    console.log(
      colors.dim("\nStep 1/4: Getting Kusama news for the selected month..."),
    );

    const newsContent = await runCommand([
      "deno",
      "run",
      "-A",
      getNewsScript,
      "--month",
      selectedMonth.month,
      "--year",
      selectedMonth.year.toString(),
    ]);

    // Extract just the result part (after "Result:")
    const resultMatch = newsContent.match(/Result:\s*([\s\S]*)/);
    const newsResult = resultMatch ? resultMatch[1].trim() : newsContent;

    console.log(colors.green("✅ News retrieved successfully!"));
    console.log(colors.dim("Preview:"));
    console.log(colors.dim(newsResult.substring(0, 200) + "..."));

    // Step 2: Generate lyrics based on the news
    console.log(
      colors.dim("\nStep 2/4: Generating lyrics based on the news..."),
    );

    let lyrics;
    if (!args.instrumental) {
      lyrics = await runCommand([
        "deno",
        "run",
        "-A",
        makeLyricsScript,
        "--context",
        newsResult,
        "--month",
        selectedMonth.month,
        "--year",
        selectedMonth.year.toString(),
      ]);

      console.log(colors.green("✅ Lyrics generated successfully!"));
      console.log(colors.dim("Preview:"));

      // Show first few lines of lyrics
      const lyricsPreview = lyrics.split("\n").slice(0, 5).join("\n");
      console.log(colors.dim(lyricsPreview + "\n..."));
    } else {
      console.log(
        colors.yellow("Skipping lyrics generation (instrumental mode)"),
      );
      lyrics = "";
    }

    // Step 3: Create music with the lyrics
    console.log(colors.dim("\nStep 3/4: Creating music..."));

    const musicArgs = [
      "deno",
      "run",
      "-A",
      createMusicScript,
      "--prompt",
      `Music about Kusama blockchain in ${selectedMonth.month} ${selectedMonth.year}`,
      "--style",
      selectedMonth.musicStyle,
      "--title",
      title,
      "--model",
      args.model,
    ];

    // Only add BPM if it's defined
    if (selectedMonth.bpm) {
      musicArgs.push("--bpm", selectedMonth.bpm.toString());
    }

    if (args.instrumental) {
      musicArgs.push("--instrumental");
    } else if (lyrics) {
      // Check if lyrics exceed API limit and truncate if necessary
      const maxLyricsLength = 2900; // Slightly below the 2999 limit for safety
      let truncatedLyrics = lyrics;

      if (lyrics.length > maxLyricsLength) {
        console.log(
          colors.yellow(`Lyrics exceed the API limit, truncating...`),
        );
        // Find the last complete verse/chorus that fits
        const lines = lyrics.split("\n");
        let currentLength = 0;
        let truncatedLines = [];

        for (const line of lines) {
          if (currentLength + line.length + 1 <= maxLyricsLength) {
            truncatedLines.push(line);
            currentLength += line.length + 1; // +1 for newline
          } else {
            break;
          }
        }

        truncatedLyrics = truncatedLines.join("\n");
        console.log(
          colors.dim(
            `Truncated lyrics from ${lyrics.length} to ${truncatedLyrics.length} characters`,
          ),
        );
      }

      musicArgs.push("--lyrics", truncatedLyrics);
    }

    const musicResult = await runCommand(musicArgs);

    // Step 4: Create thumbnail for the music
    console.log(colors.dim("\nStep 4/4: Creating thumbnail image..."));

    // Prepare input directory for thumbnail generator
    console.log(colors.dim("• Preparing input for thumbnail generation..."));

    // Make sure the input directory exists
    const thumbnailInputDir = join(baseDir, "04_createThumbnail", "input");
    await Deno.mkdir(thumbnailInputDir, { recursive: true });

    try {
      // Clear the thumbnail input directory to ensure we only have the current month's files
      console.log(colors.dim("• Clearing thumbnail input directory..."));
      for await (const entry of Deno.readDir(thumbnailInputDir)) {
        try {
          await Deno.remove(join(thumbnailInputDir, entry.name));
        } catch (removeError) {
          console.log(
            colors.yellow(
              `• Warning: Could not remove file ${entry.name}: ${removeError.message}`,
            ),
          );
        }
      }
      console.log(colors.dim("• Thumbnail input directory cleared"));

      // Copy the current lyrics file to thumbnail input directory
      const lyricsFilename =
        `kusama_${selectedMonth.month.toLowerCase()}_${selectedMonth.year}_lyrics.md`;
      const lyricsSourcePath = join(baseDir, "output", lyricsFilename);
      const lyricsTargetPath = join(thumbnailInputDir, lyricsFilename);

      // Check if lyrics file exists
      if (await exists(lyricsSourcePath)) {
        await Deno.copyFile(lyricsSourcePath, lyricsTargetPath);
        console.log(
          colors.dim(
            `• Copied lyrics file to thumbnail input directory: ${lyricsFilename}`,
          ),
        );
      } else {
        console.log(
          colors.yellow(
            `• Warning: Lyrics file not found at ${lyricsSourcePath}`,
          ),
        );
      }

      // Copy analysis.json to thumbnail input directory
      const analysisSourcePath = join(baseDir, "output", "analysis.json");
      const analysisTargetPath = join(thumbnailInputDir, "analysis.json");

      if (await exists(analysisSourcePath)) {
        await Deno.copyFile(analysisSourcePath, analysisTargetPath);
        console.log(
          colors.dim(`• Copied analysis data to thumbnail input directory`),
        );
      } else {
        console.log(
          colors.yellow(
            `• Warning: Analysis file not found at ${analysisSourcePath}`,
          ),
        );
      }
    } catch (prepError) {
      console.log(
        colors.yellow(
          `• Warning: Error preparing thumbnail input: ${prepError.message}`,
        ),
      );
    }

    // Create thumbnail with appropriate parameters
    const thumbnailArgs = [
      "deno",
      "run",
      "-A",
      createThumbnailScript,
      "--title",
      title,
      "--style",
      selectedMonth.musicStyle,
      "--prompt",
      `Kusama blockchain visualization for ${selectedMonth.month} ${selectedMonth.year}`,
      "--output",
      `kusama_${selectedMonth.month.toLowerCase()}_${selectedMonth.year}_cover.png`,
      "--ratio",
      "1:1",
    ];

    const thumbnailResult = await runCommand(thumbnailArgs);

    const successMessage =
      `✅ Month processed successfully! Your Kusama ${selectedMonth.month} ${selectedMonth.year} music and thumbnail have been created.`;
    console.log(colors.green(`\n${successMessage}`));
    console.log(
      colors.cyan(
        `Your Kusama ${selectedMonth.month} ${selectedMonth.year} music and thumbnail have been created.`,
      ),
    );

    const styleMessage =
      `Style: ${selectedMonth.musicStyle} (${selectedMonth.bpm} BPM), based on ${selectedMonth.count} transactions`;
    console.log(
      colors.dim(
        `Style: ${selectedMonth.musicStyle} (${selectedMonth.bpm} BPM)`,
      ),
    );
    console.log(colors.dim(`Based on ${selectedMonth.count} transactions`));

    // Add success to logs
    if (logs) {
      logs.push(`${new Date().toISOString()} - ${successMessage}`);
      logs.push(`${new Date().toISOString()} - ${styleMessage}`);
    }

    return true;
  } catch (error) {
    const errorMessage =
      `❌ Error processing ${selectedMonth.month} ${selectedMonth.year}: ${error.message}`;
    console.error(
      colors.red(
        `\n${errorMessage}`,
      ),
    );

    // Add error to logs
    if (logs) {
      logs.push(`${new Date().toISOString()} - ${errorMessage}`);
    }

    return false;
  }
}

/**
 * Main function to orchestrate the pipeline
 */
async function main() {
  try {
    console.log(colors.cyan("🎵 Starting Kusama MusicGen Pipeline 🎵"));

    // Step 1: Load analysis data
    let analysisData;

    console.log(
      colors.dim("Step 1: Loading Kusama blockchain transaction data..."),
    );

    // Check if analysis directory exists or if analysis.json doesn't exist
    if (!await exists(analysisOutputDir) || !await exists(analysisJsonPath)) {
      console.log(colors.dim("Analysis data not found, running analysis..."));

      // Ensure directories exist
      await Deno.mkdir(analysisOutputDir, { recursive: true });

      // Run the analysis script
      try {
        console.log(colors.dim("Running analysis..."));
        await runCommand(["deno", "run", "-A", analysisScript]);
        console.log(colors.green("✅ Analysis completed successfully!"));
      } catch (error) {
        console.error(colors.red(`Error running analysis: ${error.message}`));
        Deno.exit(1);
      }
    } else if (!args["skip-analysis"]) {
      // If not skipping analysis and it exists, check if we should re-run
      console.log(
        colors.dim(
          "Analysis data found. Use --skip-analysis to skip re-running analysis.",
        ),
      );

      try {
        console.log(
          colors.dim("Running analysis to ensure up-to-date data..."),
        );
        await runCommand(["deno", "run", "-A", analysisScript]);
        console.log(colors.green("✅ Analysis completed successfully!"));
      } catch (error) {
        console.error(colors.red(`Error running analysis: ${error.message}`));
        Deno.exit(1);
      }
    } else {
      console.log(colors.dim("Using existing analysis data (--skip-analysis)"));
    }

    // Load the analysis data
    try {
      let analysisJson;

      // Check if data exists in the new typst directory
      if (await exists(analysisTypstJsonPath)) {
        console.log(colors.dim("Using analysis data from typst directory"));
        analysisJson = await Deno.readTextFile(analysisTypstJsonPath);
      } // Then try the data directory
      else if (await exists(analysisJsonPath)) {
        console.log(
          colors.dim("Using analysis data from output/data directory"),
        );
        analysisJson = await Deno.readTextFile(analysisJsonPath);
      } // Finally, try the old paths for compatibility
      else if (
        await exists(
          join(baseDir, "00_analysis", "typst_report", "analysis.json"),
        )
      ) {
        const oldPath = join(
          baseDir,
          "00_analysis",
          "typst_report",
          "analysis.json",
        );
        console.log(
          colors.dim(`Using analysis data from legacy location: ${oldPath}`),
        );
        analysisJson = await Deno.readTextFile(oldPath);
      } else {
        throw new Error("Could not find analysis.json in any location");
      }

      // Ensure the PDF is copied to output directories if it exists
      const rootOutputDir = join(baseDir, "output");

      // Ensure output directory exists
      await Deno.mkdir(rootOutputDir, { recursive: true });

      // Check for PDF in the output directory
      if (await exists(analysisPdfPath)) {
        console.log(
          colors.dim(`Found analysis report PDF at ${analysisPdfPath}`),
        );

        // Copy to the root output directory
        const rootReportPath = join(
          rootOutputDir,
          "kusama_analysis_report.pdf",
        );
        await Deno.copyFile(analysisPdfPath, rootReportPath);
        console.log(colors.dim(`Copied analysis report to ${rootReportPath}`));

        console.log(
          colors.green("✅ Analysis report PDF copied to output folders"),
        );
      } else {
        console.log(
          colors.yellow(`Note: Analysis PDF not found at ${analysisPdfPath}`),
        );
      }

      analysisData = JSON.parse(analysisJson);
      console.log(colors.green("✅ Analysis data loaded successfully!"));
    } catch (error) {
      console.error(
        colors.red(`Error reading analysis data: ${error.message}`),
      );
      Deno.exit(1);
    }

    // Step 2: Process months
    console.log(colors.dim("\nStep 2: Processing months..."));

    if (args["loop-all-months"]) {
      // Process all months in chronological order
      console.log(colors.blue("Processing all months from analysis data..."));

      // Create logs array to store processing information
      const logs = [
        `Start processing all months - ${new Date().toISOString()}`,
      ];
      logs.push(`Total months to process: ${analysisData.monthlyData.length}`);

      // Sort months chronologically
      const chronologicalMonths = [...analysisData.monthlyData].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        const months = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];
        return months.indexOf(a.month) - months.indexOf(b.month);
      });

      let successCount = 0;
      const totalMonths = chronologicalMonths.length;
      logs.push(`Months are sorted chronologically`);

      for (let i = 0; i < totalMonths; i++) {
        const month = chronologicalMonths[i];
        const progressMessage = `Processing month ${
          i + 1
        } of ${totalMonths}: ${month.month} ${month.year}`;
        console.log(colors.blue(progressMessage));
        logs.push(`\n${new Date().toISOString()} - ${progressMessage}`);

        const success = await processMonth(month, analysisData, args, logs);
        if (success) {
          successCount++;
        }
      }

      const completionMessage =
        `✅ Completed processing ${successCount} out of ${totalMonths} months`;
      console.log(colors.green(`\n${completionMessage}`));
      logs.push(`\n${new Date().toISOString()} - ${completionMessage}`);

      if (successCount < totalMonths) {
        const warningMessage = `⚠️ Some months (${
          totalMonths - successCount
        }) failed to process completely`;
        console.log(colors.yellow(warningMessage));
        logs.push(`${new Date().toISOString()} - ${warningMessage}`);
      }

      // Write logs to file
      const logsPath = join(baseDir, "output", "logs.txt");
      try {
        await Deno.writeTextFile(logsPath, logs.join("\n"));
        console.log(colors.dim(`Processing logs saved to ${logsPath}`));
      } catch (logError) {
        console.error(colors.red(`Error writing logs: ${logError.message}`));
      }
    } else if (args["process-year"]) {
      // Process all months for a specific year
      const yearToProcess = parseInt(args["process-year"]);
      if (isNaN(yearToProcess)) {
        console.error(colors.red(`Invalid year: ${args["process-year"]}`));
        Deno.exit(1);
      }

      // Create logs array to store processing information
      const logs = [
        `Start processing year ${yearToProcess} - ${new Date().toISOString()}`,
      ];

      // Filter and sort months for the specified year
      const monthsForYear = analysisData.monthlyData
        .filter((m) => m.year === yearToProcess)
        .sort((a, b) => {
          const months = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ];
          return months.indexOf(a.month) - months.indexOf(b.month);
        });

      if (monthsForYear.length === 0) {
        const errorMessage = `No data found for year ${yearToProcess}`;
        console.error(colors.red(errorMessage));
        logs.push(`${new Date().toISOString()} - Error: ${errorMessage}`);

        // Write logs to file even if we exit
        const logsPath = join(baseDir, "output", "logs.txt");
        try {
          await Deno.writeTextFile(logsPath, logs.join("\n"));
        } catch (logError) {
          console.error(colors.red(`Error writing logs: ${logError.message}`));
        }
        Deno.exit(1);
      }

      const startMessage = `Processing all months for year ${yearToProcess}...`;
      console.log(colors.blue(startMessage));
      logs.push(`${new Date().toISOString()} - ${startMessage}`);
      logs.push(`Total months to process: ${monthsForYear.length}`);

      let successCount = 0;
      const totalMonths = monthsForYear.length;

      for (let i = 0; i < totalMonths; i++) {
        const month = monthsForYear[i];
        const progressMessage = `Processing month ${
          i + 1
        } of ${totalMonths}: ${month.month} ${yearToProcess}`;
        console.log(colors.blue(progressMessage));
        logs.push(`\n${new Date().toISOString()} - ${progressMessage}`);

        const success = await processMonth(month, analysisData, args, logs);
        if (success) {
          successCount++;
        }
      }

      const completionMessage =
        `✅ Completed processing ${successCount} out of ${totalMonths} months for year ${yearToProcess}`;
      console.log(colors.green(`\n${completionMessage}`));
      logs.push(`\n${new Date().toISOString()} - ${completionMessage}`);

      if (successCount < totalMonths) {
        const warningMessage = `⚠️ Some months (${
          totalMonths - successCount
        }) failed to process completely`;
        console.log(colors.yellow(warningMessage));
        logs.push(`${new Date().toISOString()} - ${warningMessage}`);
      }

      // Write logs to file
      const logsPath = join(baseDir, "output", "logs.txt");
      try {
        await Deno.writeTextFile(logsPath, logs.join("\n"));
        console.log(colors.dim(`Processing logs saved to ${logsPath}`));
      } catch (logError) {
        console.error(colors.red(`Error writing logs: ${logError.message}`));
      }
    } else if (args.month && args.year) {
      // Process only the specified month
      const selectedMonth = analysisData.monthlyData.find(
        (m) =>
          m.month.toLowerCase() === args.month.toLowerCase() &&
          m.year === parseInt(args.year),
      );

      if (!selectedMonth) {
        console.error(
          colors.red(`No data found for ${args.month} ${args.year}`),
        );
        Deno.exit(1);
      }

      const success = await processMonth(selectedMonth, analysisData, args);
      if (!success) {
        console.error(
          colors.red(`Failed to process ${args.month} ${args.year}`),
        );
        Deno.exit(1);
      }
    } else {
      // Default: Process only the first month in the data
      const selectedMonth = analysisData.monthlyData[0];
      console.log(
        colors.blue(
          `No month specified, using first month in data: ${selectedMonth.month} ${selectedMonth.year}`,
        ),
      );

      const success = await processMonth(selectedMonth, analysisData, args);
      if (!success) {
        console.error(
          colors.red(
            `Failed to process ${selectedMonth.month} ${selectedMonth.year}`,
          ),
        );
        Deno.exit(1);
      }
    }

    console.log(colors.green("\n🎉 Pipeline completed successfully! 🎉"));
  } catch (error) {
    console.error(colors.red(`\n❌ Error: ${error.message}`));
    Deno.exit(1);
  }
}

// Run the main function
await main();
