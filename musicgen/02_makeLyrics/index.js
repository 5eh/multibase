import { parseArgs } from "jsr:@std/cli/parse-args";
import { OpenAI } from "jsr:@openai/openai";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
if (!OPENAI_API_KEY) {
  console.error("Error: OPENAI_API_KEY environment variable is not set");
  Deno.exit(1);
}

// Parse command line arguments
const args = parseArgs(Deno.args, {
  string: ["context", "month", "year"],
  alias: { c: "context", m: "month", y: "year" },
});

if (!args.context) {
  console.error("Usage: deno run -A index.js --context=\"markdown formatted news content\"");
  console.error("   or: deno run -A index.js -c=\"markdown formatted news content\" --month=\"January\" --year=\"2021\"");
  Deno.exit(1);
}

const context = args.context;
const month = args.month || "";
const year = args.year || "";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Prepare prompt for song lyrics generation
const prompt = `Create meaningful song lyrics based on the following content:

${context}

${month && year ? `These lyrics should specifically reference ${month} ${year} as the time period.` : ""}

The lyrics should:
- Capture the essence and emotional core of the content about Kusama blockchain
- Include a chorus and at least two verses
- Be creative, original, and emotionally resonant
- ${month && year ? `Explicitly mention "${month} ${year}" at least once in the lyrics` : ""}
- Include blockchain terminology and Kusama-specific references
- Be suitable for a musical composition`;

try {
  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are an expert songwriter skilled at creating lyrics based on recent events and news. You can transform factual content into emotional, artistic song lyrics. You understand how to capture the essence of a story or event and transform it into meaningful musical poetry."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.9,
    max_tokens: 800,
  });

  const lyrics = chatCompletion.choices[0].message.content;

  // Display only the lyrics
  console.log(lyrics);
  
  // Determine if we're running from the module directory or from the musicgen root
  const isRunningFromRoot = Deno.cwd().endsWith("musicgen") && !Deno.cwd().endsWith("02_makeLyrics");
  
  // Set output directory based on where we're running from
  let outputDir = "./output";
  
  // Create output directory based on run location
  try {
    if (isRunningFromRoot) {
      // If running from musicgen root, ensure both root and module output directories exist
      await Deno.mkdir(outputDir, { recursive: true });
      await Deno.mkdir("./02_makeLyrics/output", { recursive: true });
    } else {
      // If running from module directory, just ensure the module output directory exists
      await Deno.mkdir(outputDir, { recursive: true });
    }
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw error;
    }
  }
  
  // Create a filename based on month/year or current date
  const filename = month && year 
    ? `kusama_${month.toLowerCase()}_${year}_lyrics.md` 
    : `lyrics_${new Date().toISOString().split('T')[0]}.md`;
  
  // Determine the final output path
  const filePath = isRunningFromRoot 
    ? `${outputDir}/${filename}`  // Save to root output when run from root
    : `${outputDir}/${filename}`;  // Save to module output when run from module
  
  // Save lyrics to a markdown file
  await Deno.writeTextFile(filePath, lyrics);
  
  console.log(`\nLyrics saved to ${filePath}`);
  // Don't return at module level

} catch (err) {
  console.error("ERROR OCCURRED:");

  if (err.response) {
    console.error(`Status: ${err.response.status}`);
    console.error(`Message: ${err.response.data?.error?.message || "Unknown API error"}`);
  } else {
    console.error(err.message || err);
  }

  console.error("Tip: Make sure your OPENAI_API_KEY is correctly set and valid");

  Deno.exit(1);
}
