import { parseArgs } from "jsr:@std/cli/parse-args";
import * as colors from "jsr:@std/fmt/colors";
import { ensureDir } from "jsr:@std/fs/ensure-dir";

const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
if (!PERPLEXITY_API_KEY) {
  console.error(
    colors.red("Error: PERPLEXITY_API_KEY environment variable is not set"),
  );
  Deno.exit(1);
}

// Parse command line arguments
const args = parseArgs(Deno.args, {
  string: ["query", "month", "year"],
  alias: { q: "query", m: "month", y: "year" },
});

// Determine the query to use
let userQuery;
if (args.month && args.year) {
  userQuery = `Kusama blockchain news and events in ${args.month} ${args.year}`;
  console.log(colors.blue(`Searching for Kusama news from: ${args.month} ${args.year}`));
} else if (args.query) {
  userQuery = args.query;
  console.log(colors.blue(`Searching: "${userQuery}"`));
} else {
  console.error(
    colors.yellow('Usage: deno run -A index.js --query="your search query"'),
  );
  console.error(
    colors.yellow('   or: deno run -A index.js --month="January" --year="2021"'),
  );
  Deno.exit(1);
}

// Prepare system prompt based on whether we're searching for a specific month
const systemPrompt = args.month && args.year 
  ? `You are a blockchain news reporter specializing in the Kusama ecosystem. 
     Create a well-structured news article summarizing key Kusama events, developments, 
     and market activity during ${args.month} ${args.year}. 
     Include specific dates, transaction volumes, governance proposals, 
     parachain auctions, and other relevant information from that time period.
     Format as a proper news article with headline, date, and structured paragraphs.
     Be factual and precise.`
  : "Be precise and concise.";

const options = {
  method: "POST",
  headers: {
    Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "sonar-pro",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userQuery },
    ],
    max_tokens: 1500,
    temperature: 0.2,
    top_p: 0.9,
    search_domain_filter: null,
    return_images: false,
    return_related_questions: false,
    search_recency_filter: args.month && args.year ? null : "day", // Don't limit to recent news for historical queries
    top_k: 0,
    stream: false,
    presence_penalty: 0,
    frequency_penalty: 1,
    response_format: null,
  }),
};

try {
  const response = await fetch(
    "https://api.perplexity.ai/chat/completions",
    options,
  );
  const responseData = await response.json();
  const content = responseData.choices[0].message.content;
  console.log(colors.green("\nResult:"));
  console.log(content);
  
  // Create output directory and save to markdown file
  await ensureDir("./output");
  
  // Create filename based on query
  let filename;
  if (args.month && args.year) {
    filename = `kusama-news-${args.month.toLowerCase()}-${args.year}.md`;
  } else {
    filename = `query-results-${new Date().toISOString().split('T')[0]}.md`;
  }
  
  // Create title for the markdown file
  let title;
  if (args.month && args.year) {
    title = `# Kusama News - ${args.month} ${args.year}\n\n`;
  } else {
    title = `# Search Results: ${userQuery}\n\n`;
  }
  
  // Write the content to the file
  await Deno.writeTextFile(`./output/${filename}`, title + content);
  console.log(colors.green(`\nOutput saved to output/${filename}`));
  
} catch (err) {
  console.error(colors.red("Error:"), err);
}
