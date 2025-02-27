/**
 * MusicGen Pipeline
 * 
 * This script orchestrates the full pipeline:
 * 1. Analyze blockchain transaction data using 00_analysis
 * 2. Get news about Kusama for a specific month using 01_getNews
 * 3. Generate lyrics based on the news using 02_makeLyrics
 * 4. Create music with the lyrics using 03_createMusic, with style based on transaction volume
 */

import * as colors from "jsr:@std/fmt/colors";
import { join } from "jsr:@std/path";
import { parseArgs } from "jsr:@std/cli/parse-args";
import { exists } from "jsr:@std/fs/exists";

// Check for required API keys
const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const APIBOX_API_KEY = Deno.env.get("APIBOX_API_KEY");

// Validate API keys
const missingKeys = [];
if (!PERPLEXITY_API_KEY) missingKeys.push("PERPLEXITY_API_KEY");
if (!OPENAI_API_KEY) missingKeys.push("OPENAI_API_KEY");
if (!APIBOX_API_KEY) missingKeys.push("APIBOX_API_KEY");

if (missingKeys.length > 0) {
  console.error(colors.red(`Error: Missing required environment variables: ${missingKeys.join(", ")}`));
  console.error(colors.yellow("Please set these environment variables before running the script."));
  Deno.exit(1);
}

// Parse command line arguments
const args = parseArgs(Deno.args, {
  string: ["month", "year", "model", "title"],
  boolean: ["instrumental", "verbose", "skip-analysis"],
  alias: {
    m: "month",
    y: "year",
    d: "model",
    t: "title",
    i: "instrumental",
    v: "verbose",
    s: "skip-analysis"
  },
  default: {
    model: "V3_5",
    instrumental: false,
    verbose: false,
    "skip-analysis": false
  }
});

// Display help message if requested
if (args.help) {
  console.log(colors.cyan(`
Kusama MusicGen Pipeline

Usage:
  deno run -A main.js [options]

Options:
  -m, --month=TEXT       Month to analyze (e.g., "January")
  -y, --year=TEXT        Year to analyze (e.g., "2021")
  -t, --title=TEXT       Music title (default: "Kusama <Month> <Year>")
  -d, --model=TEXT       Music model: V3_5 or V4 (default: V3_5)
  -i, --instrumental     Generate instrumental music without lyrics
  -v, --verbose          Show detailed output
  -s, --skip-analysis    Skip analysis step (use existing analysis.json)
  -h, --help             Show this help message

Example:
  deno run -A main.js --month="January" --year="2021"
`));
  Deno.exit(0);
}

// Validate month and year if provided
if ((args.month && !args.year) || (!args.month && args.year)) {
  console.error(colors.red("Error: Both month and year must be provided together"));
  Deno.exit(1);
}

// Set up paths to the individual scripts
const analysisScript = join(Deno.cwd(), "musicgen", "00_analysis", "index.js");
const analysisOutputDir = join(Deno.cwd(), "musicgen", "00_analysis", "output");
const analysisJsonPath = join(analysisOutputDir, "analysis.json");
const getNewsScript = join(Deno.cwd(), "musicgen", "01_getNews", "index.js");
const makeLyricsScript = join(Deno.cwd(), "musicgen", "02_makeLyrics", "index.js");
const createMusicScript = join(Deno.cwd(), "musicgen", "03_createMusic", "index.js");

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
    ...options
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
 * Main function to orchestrate the pipeline
 */
async function main() {
  try {
    console.log(colors.cyan("🎵 Starting Kusama MusicGen Pipeline 🎵"));
    
    // Step 1: Run analysis or use existing analysis
    let analysisData;
    
    if (!args["skip-analysis"] || !(await exists(analysisJsonPath))) {
      console.log(colors.dim("Step 1/4: Analyzing Kusama blockchain transactions..."));
      
      await runCommand([
        "deno", "run", "-A", analysisScript
      ]);
      
      console.log(colors.green("✅ Analysis completed successfully!"));
    } else {
      console.log(colors.yellow("Skipping analysis step, using existing analysis.json"));
    }
    
    // Load the analysis data
    try {
      const analysisJson = await Deno.readTextFile(analysisJsonPath);
      analysisData = JSON.parse(analysisJson);
    } catch (error) {
      console.error(colors.red(`Error reading analysis data: ${error.message}`));
      Deno.exit(1);
    }
    
    // Select month data to use
    let selectedMonth;
    
    if (args.month && args.year) {
      // Find the specified month in the data
      selectedMonth = analysisData.monthlyData.find(
        m => m.month.toLowerCase() === args.month.toLowerCase() && m.year === parseInt(args.year)
      );
      
      if (!selectedMonth) {
        console.error(colors.red(`No data found for ${args.month} ${args.year}`));
        Deno.exit(1);
      }
    } else {
      // Use the first month in the data (usually the earliest)
      selectedMonth = analysisData.monthlyData[0];
      console.log(colors.blue(`No month specified, using first month in data: ${selectedMonth.month} ${selectedMonth.year}`));
    }
    
    console.log(colors.dim(`Selected month: ${selectedMonth.month} ${selectedMonth.year}`));
    console.log(colors.dim(`Transaction count: ${selectedMonth.count}`));
    console.log(colors.dim(`Music style: ${selectedMonth.musicStyle} (${selectedMonth.bpm} BPM)`));
    
    // Set title if not provided
    const title = args.title || `Kusama ${selectedMonth.month} ${selectedMonth.year}`;
    
    // Step 2: Get news about Kusama for the selected month
    console.log(colors.dim("\nStep 2/4: Getting Kusama news for the selected month..."));
    
    const newsContent = await runCommand([
      "deno", "run", "-A", getNewsScript,
      "--month", selectedMonth.month,
      "--year", selectedMonth.year.toString()
    ]);
    
    // Extract just the result part (after "Result:")
    const resultMatch = newsContent.match(/Result:\s*([\s\S]*)/);
    const newsResult = resultMatch ? resultMatch[1].trim() : newsContent;
    
    console.log(colors.green("✅ News retrieved successfully!"));
    console.log(colors.dim("Preview:"));
    console.log(colors.dim(newsResult.substring(0, 200) + "..."));
    
    // Step 3: Generate lyrics based on the news
    console.log(colors.dim("\nStep 3/4: Generating lyrics based on the news..."));
    
    let lyrics;
    if (!args.instrumental) {
      lyrics = await runCommand([
        "deno", "run", "-A", makeLyricsScript,
        "--context", newsResult,
        "--month", selectedMonth.month,
        "--year", selectedMonth.year.toString()
      ]);
      
      console.log(colors.green("✅ Lyrics generated successfully!"));
      console.log(colors.dim("Preview:"));
      
      // Show first few lines of lyrics
      const lyricsPreview = lyrics.split("\n").slice(0, 5).join("\n");
      console.log(colors.dim(lyricsPreview + "\n..."));
    } else {
      console.log(colors.yellow("Skipping lyrics generation (instrumental mode)"));
      lyrics = "";
    }
    
    // Step 4: Create music with the lyrics
    console.log(colors.dim("\nStep 4/4: Creating music..."));
    
    const musicArgs = [
      "deno", "run", "-A", createMusicScript,
      "--prompt", `Music about Kusama blockchain in ${selectedMonth.month} ${selectedMonth.year}`,
      "--style", selectedMonth.musicStyle,
      "--title", title,
      "--model", args.model,
      "--bpm", selectedMonth.bpm.toString()
    ];
    
    if (args.instrumental) {
      musicArgs.push("--instrumental");
    } else if (lyrics) {
      musicArgs.push("--lyrics", lyrics);
    }
    
    const musicResult = await runCommand(musicArgs);
    
    console.log(colors.green("\n✅ Pipeline completed successfully!"));
    console.log(colors.cyan(`Your Kusama ${selectedMonth.month} ${selectedMonth.year} music has been created.`));
    console.log(colors.dim(`Style: ${selectedMonth.musicStyle} (${selectedMonth.bpm} BPM)`));
    console.log(colors.dim(`Based on ${selectedMonth.count} transactions`));
    
  } catch (error) {
    console.error(colors.red(`\n❌ Error: ${error.message}`));
    Deno.exit(1);
  }
}

// Run the main function
await main();
