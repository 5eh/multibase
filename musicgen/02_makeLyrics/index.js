import { parseArgs } from "jsr:@std/cli/parse-args";
import { OpenAI } from "jsr:@openai/openai";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
if (!OPENAI_API_KEY) {
  console.error("Error: OPENAI_API_KEY environment variable is not set");
  Deno.exit(1);
}

// Parse command line arguments
const args = parseArgs(Deno.args, {
  string: ["context"],
  alias: { c: "context" },
});

if (!args.context) {
  console.error("Usage: deno run -A index.js --context=\"markdown formatted news content\"");
  console.error("   or: deno run -A index.js -c=\"markdown formatted news content\"");
  Deno.exit(1);
}

const context = args.context;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Prepare prompt for song lyrics generation
const prompt = `Create meaningful song lyrics based on the following content:

${context}

The lyrics should:
- Capture the essence and emotional core of the content
- Include a chorus and at least two verses
- Be creative, original, and emotionally resonant
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
