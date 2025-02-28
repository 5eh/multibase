import { parseArgs } from "jsr:@std/cli/parse-args";
import { OpenAI } from "jsr:@openai/openai";
import * as colors from "jsr:@std/fmt/colors";
import { ensureDir } from "jsr:@std/fs/ensure-dir";
import { setupPaths, compileTypst } from "../common/output.js";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
if (!OPENAI_API_KEY) {
  console.error(colors.red("Error: OPENAI_API_KEY environment variable is not set"));
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
  
  // Setup standardized paths
  const paths = await setupPaths("02_makeLyrics");
  
  // Create a filename based on month/year or current date
  const baseFilename = month && year 
    ? `kusama_${month.toLowerCase()}_${year}` 
    : `lyrics_${new Date().toISOString().split('T')[0]}`;
  
  const mdFilename = `${baseFilename}_lyrics.md`;
  
  // Determine the final output paths
  const mdFilePath = paths.getOutputPath(mdFilename);
  const rootMdPath = paths.getRootOutputPath(mdFilename);
  
  // Save lyrics to a markdown file in module output
  await Deno.writeTextFile(mdFilePath, lyrics);
  
  // Also save to root output if running from root
  if (paths.isRunningFromRoot) {
    await Deno.writeTextFile(rootMdPath, lyrics);
  }
  
  console.log(colors.green(`\nLyrics saved to ${mdFilePath}`));
  
  // Generate PDF using Typst
  try {
    console.log(colors.blue("Generating PDF version of lyrics..."));
    
    // Create lyrics_data.typ file
    const lyricsData = parseLyrics(lyrics);
    const songTitle = getSongTitle(lyrics) || `Kusama ${month} ${year}`;
    
    // Create the lyrics_data.typ content
    let dataContent = `#let title = "${songTitle}"\n`;
    dataContent += `#let subtitle = ""\n`;
    dataContent += `#let date = "${month} ${year}"\n`;
    dataContent += `#let artist = "Multibase Musical Project"\n\n`;
    
    // Add the parsed verses
    dataContent += `#let verses = (\n`;
    lyricsData.forEach(section => {
      dataContent += `  (\n`;
      dataContent += `    type: "${section.type}",\n`;
      if (section.number !== undefined) {
        dataContent += `    number: ${section.number},\n`;
      }
      dataContent += `    content: [\n`;
      
      // Format the content properly for typst with linebreaks
      const lines = section.content.split('\n');
      const formattedLines = lines.filter(line => line.trim()).map(line => line.trim());
      
      // For each line except the last, add a line break command
      const result = [];
      for (let i = 0; i < formattedLines.length; i++) {
        if (i < formattedLines.length - 1) {
          result.push(`      ${formattedLines[i]} #linebreak()`);
        } else {
          result.push(`      ${formattedLines[i]}`);
        }
      }
      
      // Join the lines
      if (result.length > 0) {
        dataContent += `      ${result.join(`\n      `)}\n`;
      }
      
      dataContent += `    ]\n`;
      dataContent += `  ),\n`;
    });
    dataContent += `)\n\n`;
    
    // Add footnotes
    dataContent += `#let footnotes = (\n`;
    dataContent += `  [Lyrics generated from blockchain news and inspired by Kusama's innovations during ${month} ${year}.],\n`;
    dataContent += `  [Kusama is Polkadot's canary network, designed to embrace chaos and innovation.],\n`;
    dataContent += `  [KSM refers to Kusama's native token.],\n`;
    dataContent += `  [Music and lyrics by the Multibase Musical Project, 2025.]\n`;
    dataContent += `)`;
    
    // Write the data file to typst directory
    await Deno.writeTextFile(paths.getTypstPath('lyrics_data.typ'), dataContent);
    
    // Create or check if lyrics.typ template exists
    const lyricsTypPath = paths.getTypstPath('lyrics.typ');
    if (!await Deno.stat(lyricsTypPath).catch(() => false)) {
      // Create the template if it doesn't exist
      const template = `#import "lyrics_data.typ" : title, subtitle, date, artist, verses, footnotes

// Page setup
#set page(
  paper: "a4",
  margin: (x: 2cm, y: 1.8cm),
  fill: rgb("#fffef0"),
  header: [
    #set text(size: 9pt, style: "italic", fill: rgb("#666666"))
    #align(right)[#artist · #date]
    #line(length: 100%, stroke: 0.5pt + rgb("#cccccc"))
  ],
  footer: [
    #line(length: 100%, stroke: 0.5pt + rgb("#cccccc"))
    #grid(
      columns: (1fr, 1fr),
      gutter: 0pt,
      [#set text(size: 9pt, fill: rgb("#666666"), style: "italic")
       #align(left)[Multibase]],
      [#set text(size: 9pt, fill: rgb("#666666"), style: "italic")
       #align(right)[February 2025]]
    )
  ]
)

// Typography
#set text(font: "New Computer Modern", fill: rgb("#333333"), size: 9.5pt)
#set par(justify: false, leading: 0.65em)

// Verse styling function
#let style-verse(verse) = {
  let type = verse.type
  
  // Different styling for different verse types
  if type == "verse" {
    [
      #text(weight: "bold", size: 9pt)[Verse #verse.number]
      #block(
        width: 100%,
        inset: (left: 0.3cm),
        verse.content
      )
    ]
  } else if type == "chorus" {
    [
      #text(weight: "bold", size: 9pt)[Chorus]
      #block(
        width: 100%,
        inset: (left: 0.3cm),
        verse.content
      )
    ]
  } else if type == "bridge" {
    [
      #text(weight: "bold", size: 9pt)[Bridge]
      #block(
        width: 100%,
        inset: (left: 0.3cm),
        verse.content
      )
    ]
  } else if type == "outro" {
    [
      #text(weight: "bold", size: 9pt)[Outro]
      #block(
        width: 100%,
        inset: (left: 0.3cm),
        verse.content
      )
    ]
  }
}

// Title section
#align(center)[
  #block(
    width: 100%,
    inset: 8pt,
    {
      align(center)[
        #text(size: 24pt, weight: "bold", fill: rgb("#48301a"))[#title]
      ]
    }
  )
]

#v(0.5cm)

// Lyrics
#for verse in verses [
  #style-verse(verse)
  #v(0.6cm)
]


// Credits
#v(0.2cm)
#align(right)[
  #text(style: "italic", size: 8pt)[
    Generated by Multibase · #date · #artist
  ]
]`;
      
      await Deno.writeTextFile(lyricsTypPath, template);
    }
    
    // Compile the Typst file to PDF
    const pdfFilename = `${baseFilename}_lyrics.pdf`;
    const pdfOutputPath = paths.getOutputPath(pdfFilename);
    
    // Use our common utility for compiling Typst files
    const compileSuccess = await compileTypst(lyricsTypPath, pdfOutputPath);
    
    if (compileSuccess) {
      console.log(colors.green(`Lyrics PDF generated: ${pdfOutputPath}`));
      
      // If running from root, copy the PDF to the root output directory
      if (paths.isRunningFromRoot) {
        await paths.copyToRootOutput(pdfFilename);
        console.log(colors.green(`Lyrics PDF also copied to root output directory`));
      }
    }
  } catch (typstError) {
    console.log(colors.yellow(`Warning: Could not generate PDF: ${typstError.message}`));
    console.log(colors.yellow(`Make sure Typst is installed with: cargo install typst-cli`));
  }

} catch (err) {
  console.error(colors.red("ERROR OCCURRED:"));

  if (err.response) {
    console.error(`Status: ${err.response.status}`);
    console.error(`Message: ${err.response.data?.error?.message || "Unknown API error"}`);
  } else {
    console.error(err.message || err);
  }

  console.error("Tip: Make sure your OPENAI_API_KEY is correctly set and valid");

  Deno.exit(1);
}

// Function to extract a song title from lyrics
function getSongTitle(lyrics) {
  // Try to find a title in the lyrics
  const titleMatch = lyrics.match(/^#\s*(.+)$/m) || lyrics.match(/^Title:\s*(.+)$/mi);
  if (titleMatch) {
    return titleMatch[1].trim();
  }
  
  // Check for a common phrase at the start of choruses that would make a good title
  const lines = lyrics.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("January 2021") && lines[i].length < 60) {
      // Extract a nice title from the January reference
      const parts = lines[i].split(',');
      if (parts.length > 1) {
        return "Kusama Dawn"; // Use this as it combines with "January 2021, your dawn breaks anew"
      }
      return "Kusama Rising"; // Default if we can't extract a good title
    }
  }
  
  // Extract keywords from first verse if it doesn't have a heading marker
  const firstVerse = lyrics.split(/\*\*Verse\s*\d+\*\*/i)[0].trim();
  if (firstVerse) {
    const words = firstVerse.split(/\s+/).filter(w => w.length > 3 && !w.startsWith('('));
    if (words.length >= 2) {
      // Find interesting word combinations
      for (let i = 0; i < words.length - 1; i++) {
        if ((words[i].toLowerCase().includes('kusama') && words[i+1].length > 3) || 
            (words[i].length > 3 && words[i+1].toLowerCase().includes('kusama'))) {
          const title = `${words[i]} ${words[i+1]}`.replace(/[,\.\(\)]/g, '');
          return title.charAt(0).toUpperCase() + title.slice(1);
        }
      }
    }
  }
  
  return "Kusama Rising"; // Default title
}

// Function to parse lyrics into structured sections
function parseLyrics(lyrics) {
  const sections = [];
  const lines = lyrics.split('\n');
  
  let currentType = null;
  let currentNumber = null;
  let currentContent = [];
  
  // Process lines
  let i = 0;
  while (i < lines.length) {
    let line = lines[i].trim();
    i++;
    
    // Skip empty lines
    if (!line) continue;
    
    // Check for section headers in various formats
    // Common formats: **Verse 1:** or (Verse 1) or *Verse 1:*
    const verseMatch = line.match(/^\**(?:\(|\[)?Verse\s*(\d+)(?:\)|])?:?\**$/i);
    const chorusMatch = line.match(/^\**(?:\(|\[)?Chorus(?:\)|])?:?\**$/i);
    const bridgeMatch = line.match(/^\**(?:\(|\[)?Bridge(?:\)|])?:?\**$/i);
    const outroMatch = line.match(/^\**(?:\(|\[)?Outro(?:\)|])?:?\**$/i);
    
    // Handle section markers
    if (verseMatch || chorusMatch || bridgeMatch || outroMatch) {
      // Save previous section if exists
      if (currentType && currentContent.length > 0) {
        sections.push({
          type: currentType,
          number: currentNumber,
          content: currentContent.join('\n')
        });
        currentContent = [];
      }
      
      // Determine the new section type
      if (verseMatch) {
        currentType = 'verse';
        currentNumber = parseInt(verseMatch[1]);
      } else if (chorusMatch) {
        currentType = 'chorus';
        currentNumber = undefined;
      } else if (bridgeMatch) {
        currentType = 'bridge';
        currentNumber = undefined;
      } else if (outroMatch) {
        currentType = 'outro';
        currentNumber = undefined;
      }
    } else if (line.match(/^\s*\*\*Title:\s*([^*]+)\*\*/i)) {
      // Skip title lines (handled separately)
      continue;
    } else if (currentType) {
      // Add this line to the current content
      // Remove markdown formatting (** and *)
      line = line.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
      // Remove trailing spaces that may come from markdown
      line = line.replace(/\s+$/, '');
      currentContent.push(line);
    } else {
      // If there's no section yet but we have content, start a verse
      currentType = 'verse';
      currentNumber = 1;
      // Remove markdown formatting
      line = line.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
      // Remove trailing spaces
      line = line.replace(/\s+$/, '');
      currentContent.push(line);
    }
  }
  
  // Add the last section
  if (currentType && currentContent.length > 0) {
    sections.push({
      type: currentType,
      number: currentNumber,
      content: currentContent.join('\n')
    });
  }
  
  return sections;
}
