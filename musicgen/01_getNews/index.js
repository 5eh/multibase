import { parseArgs } from "jsr:@std/cli/parse-args";
import * as colors from "jsr:@std/fmt/colors";

const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
if (!PERPLEXITY_API_KEY) {
  console.error(colors.red("Error: PERPLEXITY_API_KEY environment variable is not set"));
  Deno.exit(1);
}

// Parse command line arguments
const args = parseArgs(Deno.args, {
  string: ["query"],
  alias: { q: "query" },
});

if (!args.query) {
  console.error(colors.yellow("Usage: deno run -A index.js --query=\"your search query\""));
  console.error(colors.yellow("   or: deno run -A index.js -q=\"your search query\""));
  Deno.exit(1);
}

// Query from command line argument
const userQuery = args.query;
console.log(colors.blue(`Searching: "${userQuery}"`));

const options = {
  method: 'POST',
  headers: { Authorization: `Bearer ${PERPLEXITY_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: "sonar-pro",
    messages: [
      { role: "system", content: "Be precise and concise." },
      { role: "user", content: userQuery }
    ],
    max_tokens: 123,
    temperature: 0.2,
    top_p: 0.9,
    search_domain_filter: null,
    return_images: false,
    return_related_questions: false,
    search_recency_filter: "day",
    top_k: 0,
    stream: false,
    presence_penalty: 0,
    frequency_penalty: 1,
    response_format: null
  })
};

try {
  const response = await fetch('https://api.perplexity.ai/chat/completions', options);
  const responseData = await response.json();
  console.log(colors.green("\nResult:"));
  console.log(responseData.choices[0].message.content);
} catch (err) {
  console.error(colors.red("Error:"), err);
}
