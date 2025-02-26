/**
 * MusicGen Pipeline
 * 
 * This script orchestrates the full pipeline:
 * 1. Get news about SpaceX using 01_getNews
 * 2. Generate lyrics based on the news using 02_makeLyrics
 * 3. Create music with the lyrics using 03_createMusic
 */

import * as colors from "jsr:@std/fmt/colors";
import { join } from "jsr:@std/path";
import { Command } from "jsr:@std/cli/command";

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
const cli = new Command()
  .name("musicgen")
  .description("Generate music based on SpaceX news")
  .option("-q, --query <query:string>", "News search query", { default: "latest SpaceX launch news" })
  .option("-s, --style <style:string>", "Music style", { default: "Rock" })
  .option("-t, --title <title:string>", "Music title", { default: "SpaceX Launch" })
  .option("-m, --model <model:string>", "Music model (V3_5 or V4)", { default: "V3_5" })
  .option("-i, --instrumental", "Generate instrumental music without lyrics")
  .option("-v, --verbose", "Show detailed output");

const args = cli.parse(Deno.args);

// Set up paths to the individual scripts
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
  
  const process = Deno.run({
    cmd: cmd,
    stdout: "piped",
    stderr: "piped",
    ...options
  });
  
  const [status, stdout, stderr] = await Promise.all([
    process.status(),
    process.output(),
    process.stderrOutput()
  ]);
  
  process.close();
  
  const output = new TextDecoder().decode(stdout);
  const error = new TextDecoder().decode(stderr);
  
  if (!status.success) {
    throw new Error(`Command failed with exit code ${status.code}\n${error}`);
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
    console.log(colors.cyan("🎵 Starting MusicGen Pipeline 🎵"));
    console.log(colors.dim("Step 1/3: Getting latest SpaceX news..."));
    
    // Step 1: Get news about SpaceX
    const newsQuery = args.query;
    console.log(colors.blue(`Searching for: "${newsQuery}"`));
    
    const newsContent = await runCommand([
      "deno", "run", "-A", getNewsScript, 
      "--query", newsQuery
    ]);
    
    // Extract just the result part (after "Result:")
    const resultMatch = newsContent.match(/Result:\s*([\s\S]*)/);
    const newsResult = resultMatch ? resultMatch[1].trim() : newsContent;
    
    console.log(colors.green("✅ News retrieved successfully!"));
    console.log(colors.dim("Preview:"));
    console.log(colors.dim(newsResult.substring(0, 200) + "..."));
    
    // Step 2: Generate lyrics based on the news
    console.log(colors.dim("\nStep 2/3: Generating lyrics based on the news..."));
    
    let lyrics;
    if (!args.instrumental) {
      lyrics = await runCommand([
        "deno", "run", "-A", makeLyricsScript,
        "--context", newsResult
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
    
    // Step 3: Create music with the lyrics
    console.log(colors.dim("\nStep 3/3: Creating music..."));
    
    const musicArgs = [
      "deno", "run", "-A", createMusicScript,
      "--prompt", `Music about SpaceX based on this news: ${newsResult.substring(0, 100)}...`,
      "--style", args.style,
      "--title", args.title,
      "--model", args.model
    ];
    
    if (args.instrumental) {
      musicArgs.push("--instrumental");
    } else if (lyrics) {
      musicArgs.push("--lyrics", lyrics);
    }
    
    const musicResult = await runCommand(musicArgs);
    
    console.log(colors.green("\n✅ Pipeline completed successfully!"));
    console.log(colors.cyan("Your SpaceX-inspired music has been created."));
    
  } catch (error) {
    console.error(colors.red(`\n❌ Error: ${error.message}`));
    Deno.exit(1);
  }
}

// Run the main function
await main();
