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
     Be factual and precise.
     
     IMPORTANT: You must cite sources for facts and statements using numbered footnotes like [1], [2], etc. in the text.
     Include at least 5-7 different sources throughout the article for credibility.
     
     At the end of the article, include a "## References" section with a numbered list of all cited sources.
     Each reference must include:
     - Title of the article/source
     - Author/publisher
     - Date published (if available)
     - URL (if available)
     - Brief description of the content
     
     Example of a good reference:
     [1] "Kusama Network Launch", Web3 Foundation Blog, October 2019, https://web3.foundation/news/kusama-network-launch - Announcement of the Kusama network launch with technical details.`
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
    max_tokens: 2000,
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
  
  // Determine if we're running from the module directory or from the musicgen root
  const isRunningFromRoot = Deno.cwd().endsWith("musicgen") && !Deno.cwd().endsWith("01_getNews");
  
  // Set output directory based on where we're running from
  let outputDir = "./output";
  if (isRunningFromRoot) {
    // If running from musicgen root, use the root output directory
    await ensureDir("./output");
    // Also ensure module output directory exists
    await ensureDir("./01_getNews/output");
  } else {
    // If running from module directory, use the module's output directory
    await ensureDir(outputDir);
  }
  
  // Create filename based on query
  let filename;
  if (args.month && args.year) {
    filename = `kusama_${args.month.toLowerCase()}_${args.year}_news.md`;
  } else {
    filename = `query_results_${new Date().toISOString().split('T')[0]}.md`;
  }
  
  // Create title for the markdown file
  let title;
  if (args.month && args.year) {
    title = `# Kusama News - ${args.month} ${args.year}\n\n`;
  } else {
    title = `# Search Results: ${userQuery}\n\n`;
  }
  
  // Determine the final output path
  const finalOutputPath = isRunningFromRoot 
    ? `./output/${filename}`  // Save to root output when run from root
    : `${outputDir}/${filename}`;  // Save to module output when run from module
  
  // Write the content to the file
  await Deno.writeTextFile(finalOutputPath, title + content);
  console.log(colors.green(`\nOutput saved to ${finalOutputPath}`));
  
} catch (err) {
  console.error(colors.red("Error:"), err);
}
