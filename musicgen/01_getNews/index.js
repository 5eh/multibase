import { parseArgs } from "jsr:@std/cli/parse-args";
import * as colors from "jsr:@std/fmt/colors";
import { ensureDir } from "jsr:@std/fs/ensure-dir";
import { OpenAI } from "jsr:@openai/openai";
import { setupPaths, compileTypst } from "../common/output.js";

const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

if (!PERPLEXITY_API_KEY) {
  console.error(
    colors.red("Error: PERPLEXITY_API_KEY environment variable is not set"),
  );
  Deno.exit(1);
}

// Optional OpenAI key - we'll use it if available for better structuring
if (!OPENAI_API_KEY) {
  console.log(
    colors.yellow("Note: OPENAI_API_KEY not set. Will use raw Perplexity results without additional structuring.")
  );
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
  ? `You are a blockchain news reporter specializing in the Kusama ecosystem, writing for "The Blockchain Times" newspaper.
     Create a comprehensive, detailed newspaper-style article about Kusama during ${args.month} ${args.year}.
     
     Your article should be SUBSTANTIAL and THOROUGH, providing significant depth on each topic:
     - Have a compelling, newspaper-style headline
     - Begin with a strong lead paragraph summarizing the key developments
     - Include 6-7 distinct sections with clear subheadings covering different aspects:
       * Governance/technical developments (provide detailed explanation)
       * Parachain auctions/ecosystem growth (include specific projects and auction details)
       * Market performance and trading analysis (provide context about market conditions)
       * Community developments and governance proposals
       * Notable projects and technical innovations
       * Industry impact and relationships with other blockchains
       * Future outlook and roadmap
     - Include extensive details: specific dates, transaction volumes, governance proposals, quotes from community members
     - Be written in newspaper style (factual, thorough, third-person) but with substantial content
     - Include developer perspectives and impacts on the broader ecosystem
     - End with a comprehensive forward-looking conclusion paragraph
     
     IMPORTANT: Your response should be DETAILED and SUBSTANTIAL (1500-2000 words) to provide sufficient content for our newspaper layout.
     
     IMPORTANT: You should research your facts thoroughly, but DO NOT include citation numbers like [1], [2], etc. in the text.
     Instead, incorporate attribution directly in your writing (e.g., "According to the Web3 Foundation blog..." or "As reported by...")
     
     At the end of the article, include a "## References" section listing your sources, but without any numbered citations.
     Each reference should include:
     - Title of the article/source
     - Author/publisher
     - Date published (if available)
     - Brief description of the content
     
     Example of a good reference format:
     "Kusama Network Launch", Web3 Foundation Blog, October 2019 - Announcement of the Kusama network launch with technical details.`
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
    max_tokens: 8000,
    temperature: 0.3,
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
  // Get initial response from Perplexity
  const response = await fetch(
    "https://api.perplexity.ai/chat/completions",
    options,
  );
  const responseData = await response.json();
  let content = responseData.choices[0].message.content;
  console.log(colors.green("\nPerplexity Result Received"));
  
  // Structure the content if OpenAI API key is available
  let structuredContent = content;
  if (OPENAI_API_KEY && args.month && args.year) {
    try {
      console.log(colors.blue("Structuring content with OpenAI..."));
      
      // Initialize the OpenAI client
      const openai = new OpenAI({
        apiKey: OPENAI_API_KEY,
      });
      
      // Define the system message for content structuring
      const systemMessage = `You are a professional newspaper editor restructuring content for "The Blockchain Times". Your task is to transform raw Kusama blockchain news from ${args.month} ${args.year} into a newspaper article that fills PRECISELY 2.0-2.5 columns (ideal target: 2.2 columns) in a three-column layout.
      
      NEWSPAPER STRUCTURE:
      1. Create a punchy, attention-grabbing headline (8-12 words max)
      2. Write a strong, informative lead paragraph (100-150 words)
      3. Create exactly 4-5 news articles with these characteristics:
         - Article 1: "OpenGov Implementation" - Focus on governance changes (200-250 words)
         - Article 2: "Parachain Auctions" - Focus on blockchain growth (200-250 words)
         - Article 3: "Technical Developments" - Focus on technology updates (200-250 words)
         - Article 4: "Market Performance" - Focus on KSM token activity (150-200 words)
         - Article 5: "Developer Ecosystem" - Focus on projects building on Kusama (optional, 150-200 words)
      4. Include a "Looking Forward" section (100-150 words)
      
      The TOTAL content should be PRECISELY 1100-1300 words - this is the exact amount needed to fill 2.0-2.5 columns in our newspaper layout.
      
      CRITICAL LENGTH REQUIREMENT:
      - If your content is too short (<1000 words), the newspaper will have empty space
      - If your content is too long (>1400 words), it will overflow beyond 2.5 columns
      - The ideal length is 1200 words, which perfectly fills 2.2 columns
      
      CRITICAL NEWSPAPER STYLING REQUIREMENTS:
      - ABSOLUTELY NEVER use numbered citations like [1] or [2] in the text - REMOVE ALL numbered references
      - REMOVE ALL citation numbers and references in the content, including [1], [2], etc.
      - Each article should read as a standalone news piece with its own headline and byline
      - Use journalistic style - lead with the most important information
      - Write in third person, newspaper style (objective, factual, thorough)
      - Use proper newspaper conventions (datelines, bylines, journalist-style paragraphs)
      - Each paragraph should be 2-3 sentences maximum
      - Include quotes from industry figures or unnamed sources where appropriate
      - Make content detailed with specific examples, figures, and explanations
      
      NEWSPAPER CONVENTIONS:
      - Start articles with the most important information - main facts first, details later
      - Use quotes from industry experts (e.g., "According to Sarah Jones, a developer at XYZ project...")
      - Use newspaper-style attribution (e.g., "industry observers noted" instead of citations)
      - Create a proper newspaper headline for each article that draws reader interest
      - Include specific dates, figures, and details to add credibility and depth
      
      DO NOT include any "References" or "Sources" section at the end - this is a newspaper, not an academic paper.
      The goal is to generate enough high-quality content to fill 2.5 newspaper columns while remaining authentic to newspaper style.
      
      IMPORTANT: You MUST ensure that ALL numbered references like [1], [2], etc. are completely removed from the final text.`;
      
      // Make the API call using the OpenAI client
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: systemMessage
          },
          {
            role: "user",
            content: content
          }
        ]
      });
      
      if (response.choices && response.choices.length > 0) {
        structuredContent = response.choices[0].message.content;
        console.log(colors.green("Content successfully structured for newspaper format"));
      } else {
        console.log(colors.yellow("Could not structure with OpenAI, using original content"));
        console.error(colors.red("OpenAI API returned no completions"));
      }
    } catch (openaiErr) {
      console.log(colors.yellow("Error using OpenAI API, using original content:"), openaiErr);
    }
  }
  
  // Show the content to the user
  console.log(colors.green("\nResult:"));
  console.log(structuredContent);
  
  // Set up standardized paths for this module
  const paths = await setupPaths("01_getNews");
  
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
  
  // Determine the final output paths
  const outputDataPath = paths.getOutputPath(filename);
  const rootOutputPath = paths.getRootOutputPath(filename);
  
  // Write the content to the output directory
  await Deno.writeTextFile(outputDataPath, title + structuredContent);
  
  // Copy to root output if running from root
  if (paths.isRunningFromRoot) {
    await Deno.writeTextFile(rootOutputPath, title + structuredContent);
  }
  
  console.log(colors.green(`\nOutput saved to ${outputDataPath}`));

  // Generate the newspaper Typst file and PDF
  if (args.month && args.year) {
    try {
      // Our output directories are already managed by the paths utility

      // Check if we need to update newspaper_data.typ
      const mdContent = title + content;
      
      // Extract articles from markdown
      const articles = [];
      let mainHeadline = "";
      let leadParagraph = "";
      let lookingForward = "";
      
      // First, get the main headline (the # heading)
      const mainHeadlineMatch = mdContent.match(/# (?:")?([^"\n]+)(?:")?/);
      if (mainHeadlineMatch) {
        mainHeadline = mainHeadlineMatch[1].trim();
        
        // Get lead paragraph - text between headline and first ## heading
        const leadMatch = mdContent.match(/# (?:")?[^"\n]+(?:")?(?:\n\n|\n)([^#]+?)(?=\n\n##|\n##)/s);
        if (leadMatch) {
          leadParagraph = leadMatch[1].trim();
          // Remove all citation references like [1], [2], etc. from lead paragraph
          leadParagraph = leadParagraph.replace(/\[\d+\]/g, '');
        }
      }
      
      // Extract all articles (sections with ## headings)
      const articlePattern = /## (?:")?([^"\n]+)(?:")?(?:\n\n|\n)((?:(?!##).)+)/gs;
      const articleMatches = [...mdContent.matchAll(articlePattern)];
      
      articleMatches.forEach((match, index) => {
        const title = match[1].trim();
        let content = match[2].trim();
        
        // Remove all citation references like [1], [2], etc.
        content = content.replace(/\[\d+\]/g, '');
        
        // Check if this is a "Looking Forward" or "Conclusion" section
        if (title.toLowerCase().includes("looking forward") || 
            title.toLowerCase().includes("conclusion")) {
          lookingForward = content;
        } else if (title.toLowerCase().includes("references") || 
                   title.toLowerCase().includes("sources")) {
          // Skip reference sections entirely
          return;
        } else {
          // For all other sections, create an article
          articles.push({
            title: title,
            content: content,
            byline: getBylineForArticle(index, title)
          });
        }
      });
      
      // If no "Looking Forward" section found, check for a conclusion paragraph
      if (!lookingForward && articles.length > 0) {
        const lastArticle = articles[articles.length - 1];
        const paragraphs = lastArticle.content.split("\n\n");
        if (paragraphs.length > 1) {
          // Use the last paragraph as conclusion
          lookingForward = paragraphs[paragraphs.length - 1];
          // Remove any citation references from the conclusion
          lookingForward = lookingForward.replace(/\[\d+\]/g, '');
          // Update the last article to remove this paragraph
          lastArticle.content = paragraphs.slice(0, -1).join("\n\n");
        }
      }
      
      // Final clean-up: Make sure all references are removed from content
      lookingForward = lookingForward.replace(/\[\d+\]/g, '');
      articles.forEach(article => {
        article.content = article.content.replace(/\[\d+\]/g, '');
      });
      
      // Helper function to assign appropriate bylines based on content
      function getBylineForArticle(index, title) {
        const titleLower = title.toLowerCase();
        
        if (titleLower.includes("gov") || titleLower.includes("governance")) {
          return "Blockchain Policy Correspondent";
        } else if (titleLower.includes("parachain") || titleLower.includes("ecosystem")) {
          return "Blockchain Report";
        } else if (titleLower.includes("tech") || titleLower.includes("development")) {
          return "Technology Reporter";
        } else if (titleLower.includes("market") || titleLower.includes("token") || titleLower.includes("ksm")) {
          return "Market Analysis";
        } else {
          const bylines = ["Special Correspondent", "Web3 Analyst", "Staff Reporter", "Kusama Beat"];
          return bylines[index % bylines.length];
        }
      }
      
      // Now we have:
      // - mainHeadline: The main newspaper headline
      // - leadParagraph: The intro paragraph
      // - articles: Array of { title, content, byline } for each article
      // - lookingForward: The conclusion/looking forward section
      
      // For compatibility with existing template, map to headlines array
      const headlines = [
        // First item is the main headline and lead content
        {
          title: mainHeadline,
          content: leadParagraph
        },
        // Add all the articles
        ...articles
      ];
      
      // Set conclusion
      const conclusion = lookingForward;
      
      // Create newspaper_data.typ with enhanced article data
      let dataContent = `#let title = "Kusama Blockchain"\n`;
      dataContent += `#let subtitle = "News Digest - ${args.month} ${args.year}"\n`;
      dataContent += `#let date = "${args.month} ${args.year}"\n\n`;
      
      dataContent += `#let headlines = (\n`;
      // First item is always the main headline
      dataContent += `  (\n`;
      dataContent += `    title: "${headlines[0].title}",\n`;
      dataContent += `    content: "${headlines[0].content.replace(/"/g, '\\"')}"\n`;
      dataContent += `  ),\n`;
      
      // Add remaining articles with bylines
      for (let i = 1; i < headlines.length; i++) {
        const headline = headlines[i];
        dataContent += `  (\n`;
        dataContent += `    title: "${headline.title}",\n`;
        dataContent += `    content: "${headline.content.replace(/"/g, '\\"')}",\n`;
        // Include byline if available
        if (headline.byline) {
          dataContent += `    byline: "${headline.byline}"\n`;
        } else {
          dataContent += `    byline: "${getDefaultByline(i-1, headline.title)}"\n`;
        }
        dataContent += `  ),\n`;
      }
      dataContent += `)\n\n`;
      
      dataContent += `#let conclusion = "${conclusion.replace(/"/g, '\\"')}"\n`;
      
      // Helper function for default bylines if not provided
      function getDefaultByline(index, title) {
        const titleLower = title.toLowerCase();
        
        if (titleLower.includes("gov") || titleLower.includes("governance")) {
          return "Blockchain Policy Correspondent";
        } else if (titleLower.includes("parachain") || titleLower.includes("ecosystem")) {
          return "Blockchain Report";
        } else if (titleLower.includes("tech") || titleLower.includes("development")) {
          return "Technology Reporter";
        } else if (titleLower.includes("market") || titleLower.includes("token") || titleLower.includes("ksm")) {
          return "Market Analysis";
        } else {
          const bylines = ["Special Correspondent", "Web3 Analyst", "Staff Reporter", "Kusama Beat"];
          return bylines[index % bylines.length];
        }
      }
      
      await Deno.writeTextFile(paths.getTypstPath('newspaper_data.typ'), dataContent);
      
      // Create newspaper.typ if it doesn't exist
      const newspaperTypPath = paths.getTypstPath('newspaper.typ');
      if (!await Deno.stat(newspaperTypPath).catch(() => false)) {
        // Create a basic newspaper template - this should be replaced with your actual template
        const newspaperTemplate = `#import "newspaper_data.typ" : title, subtitle, date, headlines, conclusion

// Page setup
#set page(
  margin: (x: 2cm, y: 2cm),
  fill: rgb("#f9f7f1"), // Slight off-white for newspaper feel
  header: [
    #set text(size: 9pt, style: "italic", fill: rgb("#666666"))
    #align(right)[Kusama News · ${args.month} ${args.year}]
    #line(length: 100%, stroke: 0.5pt + rgb("#dddddd"))
  ],
  footer: [
    #line(length: 100%, stroke: 0.5pt + rgb("#dddddd"))
    #grid(
      columns: (1fr, 1fr),
      gutter: 0pt,
      [#set text(size: 9pt, fill: rgb("#666666"), style: "italic")
       #align(left)[Blockchain Report]],
      [#set text(size: 9pt, fill: rgb("#666666"), style: "italic")
       #align(right)[Page 1]]
    )
  ]
)

// Text settings
#set text(font: "New Computer Modern", fill: rgb("#222222"))
#set heading(numbering: none)
#show heading: it => {
  set text(fill: rgb("#222222"))
  block(
    width: 100%,
    inset: (left: 0pt, top: 0pt, bottom: 0pt),
    it
  )
  v(0.3cm)
}

// Create a newspaper masthead
#align(center)[
  #block(
    width: 100%,
    inset: 10pt,
    {
      align(center)[
        #text(size: 48pt, weight: "bold", font: "New Computer Modern", fill: rgb("#111111"))[#title]
        #v(0.2cm)
        #text(size: 20pt, style: "italic", fill: rgb("#444444"))[#subtitle]
        #v(0.2cm)
        #text(size: 12pt, fill: rgb("#555555"))[#date]
      ]
    }
  )
]

#line(length: 100%, stroke: 1pt + black)
#v(0.5cm)

// Main headline
#let mainHeadline = headlines.at(0)
#heading(level: 1, mainHeadline.title)
#text(size: 14pt, weight: "regular")[#mainHeadline.content]

#v(1cm)

// Two-column layout for the rest of the articles
#grid(
  columns: (1fr, 1fr),
  gutter: 1cm,
  [
    // Left column articles
    #for i in range(1, calc.min(3, headlines.len())) [
      #heading(level: 2, headlines.at(i).title)
      #text(headlines.at(i).content)
      #v(1cm)
    ]
  ],
  [
    // Right column articles
    #for i in range(3, headlines.len()) [
      #heading(level: 2, headlines.at(i).title)
      #text(headlines.at(i).content)
      #v(1cm)
    ]
  ]
)

#v(1cm)

// Conclusion
#block(
  width: 100%,
  fill: rgb("#f0f0f0"),
  radius: 4pt,
  inset: 10pt,
  [
    #heading(level: 2, "Looking Forward")
    #text(conclusion)
  ]
)

#v(1.5cm)

#align(center)[
  #text(style: "italic", size: 10pt)[
    Prepared by Multibase Blockchain News · February 2025
  ]
]`;
        
        await Deno.writeTextFile(newspaperTypPath, newspaperTemplate);
      }
      
      // Define the PDF output path
      const pdfFilename = `kusama_${args.month.toLowerCase()}_${args.year}_newspaper.pdf`;
      const pdfOutputPath = paths.getOutputPath(pdfFilename);
      
      // Compile the Typst file to PDF
      const compileSuccess = await compileTypst(newspaperTypPath, pdfOutputPath);
      
      if (!compileSuccess) {
        throw new Error("Typst compilation failed");
      }
      
      // Copy to root output directory
      await paths.copyToRootOutput(pdfFilename);
      
      // PDF has been successfully created
      console.log(colors.green(`\nNewspaper PDF generated at ${pdfOutputPath}`));
    } catch (typstErr) {
      console.error(colors.yellow("\nCould not generate PDF newspaper:"), typstErr);
      console.log(colors.yellow("Make sure Typst is installed with: cargo install typst-cli"));
    }
  }
  
} catch (err) {
  console.error(colors.red("Error:"), err);
}
