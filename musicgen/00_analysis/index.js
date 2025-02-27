import { parseArgs } from "jsr:@std/cli/parse-args";
import * as colors from "jsr:@std/fmt/colors";
import { join } from "jsr:@std/path";
import { ensureDir } from "jsr:@std/fs";

// Music style mapping based on transaction volume
const MUSIC_STYLES = [
  { name: "Ambient", description: "Slow, atmospheric ambient music", minBpm: 60, maxBpm: 80 },
  { name: "Chillout", description: "Relaxed electronic music", minBpm: 80, maxBpm: 100 },
  { name: "Downtempo", description: "Mellow electronic beats", minBpm: 90, maxBpm: 110 },
  { name: "Trip Hop", description: "Moody, atmospheric beats", minBpm: 90, maxBpm: 110 },
  { name: "Lo-Fi", description: "Relaxed beats with vinyl crackle", minBpm: 70, maxBpm: 90 },
  { name: "Jazz", description: "Smooth jazz with piano", minBpm: 80, maxBpm: 120 },
  { name: "Folk", description: "Acoustic folk music", minBpm: 90, maxBpm: 120 },
  { name: "Pop", description: "Catchy pop music", minBpm: 100, maxBpm: 130 },
  { name: "Indie Rock", description: "Alternative rock with indie vibes", minBpm: 110, maxBpm: 140 },
  { name: "Rock", description: "Energetic rock music", minBpm: 120, maxBpm: 150 },
  { name: "Dance", description: "Upbeat dance music", minBpm: 120, maxBpm: 140 },
  { name: "House", description: "Electronic house music", minBpm: 120, maxBpm: 130 },
  { name: "Techno", description: "Driving electronic beats", minBpm: 120, maxBpm: 150 },
  { name: "Drum and Bass", description: "Fast-paced electronic music", minBpm: 160, maxBpm: 180 },
  { name: "Hardstyle", description: "Hard-hitting electronic music", minBpm: 150, maxBpm: 160 },
  { name: "Speedcore", description: "Extremely fast electronic music", minBpm: 180, maxBpm: 300 }
];


// Parse command line arguments
const args = parseArgs(Deno.args, {
  string: ["output"],
  default: { output: "./output" },
  alias: { o: "output" },
});

// Determine if we're running from the module directory or from the musicgen root
const isRunningFromRoot = Deno.cwd().endsWith("musicgen") && !Deno.cwd().endsWith("00_analysis");

// Set output directory based on where we're running from
let outputDir = args.output;

async function runAnalysis() {
  console.log(colors.blue("Analyzing transaction data..."));

  const url = 'http://localhost:4350/graphql';
  const query = `
  query MyQuery {
      transfers {
          timestamp
          blockNumber
      }
  }
  `;

  try {
    // Ensure output directory exists
    await ensureDir(outputDir);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.data || !data.data.transfers) {
      throw new Error('No transfer data found in the response');
    }

    // Process the data
    const transactionsByMonth = data.data.transfers.reduce((acc, transfer) => {
      const date = new Date(transfer.timestamp);
      const month = date.toLocaleString('default', { month: 'long' });
      const year = date.getFullYear();
      const key = `${month} ${year}`;
      if (!acc[key]) {
        acc[key] = 0;
      }
      acc[key]++;
      return acc;
    }, {});

    const totalTransactions = data.data.transfers.length;
    const monthEntries = Object.entries(transactionsByMonth);
    const highestMonth = monthEntries.reduce((max, entry) => entry[1] > max[1] ? entry : max, [null, 0]);
    const lowestMonth = monthEntries.reduce((min, entry) => entry[1] < min[1] ? entry : min, [null, Infinity]);

    // Calculate transaction count range for style mapping
    const maxCount = highestMonth[1];
    const minCount = lowestMonth[1];
    const countRange = maxCount - minCount;

    // Create sorted data for better presentation
    const sortedMonths = monthEntries
      .map(([monthYear, count]) => {
        const [month, year] = monthYear.split(' ');

        // Calculate music style based on transaction count
        const normalizedCount = (count - minCount) / countRange; // 0 to 1
        const styleIndex = Math.min(
          Math.floor(normalizedCount * MUSIC_STYLES.length),
          MUSIC_STYLES.length - 1
        );
        const style = MUSIC_STYLES[styleIndex];

        // Calculate BPM based on transaction count
        const bpmRange = style.maxBpm - style.minBpm;
        const bpm = Math.round(style.minBpm + (normalizedCount * bpmRange));

        return {
          month,
          year: parseInt(year),
          count,
          musicStyle: style.name,
          musicDescription: style.description,
          bpm
        };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'];
        return months.indexOf(a.month) - months.indexOf(b.month);
      });

    // Generate Markdown content
    const tableRows = sortedMonths.map(item =>
      `| ${item.month} ${item.year} | ${item.count} | ${item.musicStyle} | ${item.bpm} BPM |`
    ).join('\n');

    const markdownContent = `# Analysis of Kusama Transactions

## Overview
Total transactions analyzed: **${totalTransactions}**

## Monthly Breakdown

| Month | Number of Transactions | Music Style | BPM |
|-------|------------------------|-------------|-----|
${tableRows}

## Key Findings
- Highest transaction volume: **${highestMonth[0]}** with **${highestMonth[1]}** transactions
- Lowest transaction volume: **${lowestMonth[0]}** with **${lowestMonth[1]}** transactions
- Music styles range from Ambient (low transaction volume) to Speedcore (high volume)

This analysis provides insights into the distribution of Kusama blockchain transactions over time.

*Generated on: ${new Date().toLocaleString()}*
`;

    // Create JSON data
    const jsonData = {
      totalTransactions,
      highestMonth: {
        period: highestMonth[0],
        count: highestMonth[1]
      },
      lowestMonth: {
        period: lowestMonth[0],
        count: lowestMonth[1]
      },
      monthlyData: sortedMonths.map(item => ({
        month: item.month,
        year: item.year,
        count: item.count,
        musicStyle: item.musicStyle,
        musicDescription: item.musicDescription,
        bpm: item.bpm
      }))
    };

    // Write files
    const markdownPath = join(outputDir, 'analysis.md');
    const jsonPath = join(outputDir, 'analysis.json');

    // Create Typst data file
    let typstDir;
    if (isRunningFromRoot) {
      // If running from musicgen root
      typstDir = join(Deno.cwd(), '00_analysis', 'typst_report');
      
      // Also ensure the root output directory exists
      await ensureDir('./output');
      
      // Copy the analysis.json to the root output directory
      await Deno.writeTextFile('./output/analysis.json', JSON.stringify(result, null, 2));
    } else {
      // If running from module directory
      typstDir = join(Deno.cwd(), 'typst_report');
    }
    
    await ensureDir(typstDir);
    const typstPath = join(typstDir, 'data.typ');

    // Generate yearly data
    const yearlyData = sortedMonths.reduce((acc, item) => {
      const year = item.year;
      const existingYear = acc.find(y => y.year === year);

      if (existingYear) {
        existingYear.count += item.count;
      } else {
        acc.push({ year, count: item.count });
      }

      return acc;
    }, []).sort((a, b) => a.year - b.year);

    // Generate Typst content
    let typstContent = `#let totalTransactions = ${totalTransactions}\n`;
    typstContent += `#let highestMonth = (\n  period: "${highestMonth[0]}",\n  count: ${highestMonth[1]}\n)\n\n`;
    typstContent += `#let lowestMonth = (\n  period: "${lowestMonth[0]}",\n  count: ${lowestMonth[1]}\n)\n\n`;

    // Monthly data
    typstContent += `#let monthlyData = (\n`;
    sortedMonths.forEach(item => {
      typstContent += `  (\n`;
      typstContent += `    month: "${item.month}",\n`;
      typstContent += `    year: ${item.year},\n`;
      typstContent += `    count: ${item.count}`;
      
      // Only include music style and BPM for key months
      // November 2019 (first month), January 2021 (significant growth), November 2024 (highest spike)
      if ((item.month === "November" && item.year === 2019) || 
          (item.month === "January" && item.year === 2021) || 
          (item.month === "November" && item.year === 2024)) {
        typstContent += `,\n    musicStyle: "${item.musicStyle}",\n`;
        typstContent += `    bpm: ${item.bpm}\n`;
      } else {
        typstContent += `\n`;
      }
      typstContent += `  ),\n`;
    });
    typstContent += `)\n\n`;

    // Yearly data
    typstContent += `#let yearlyData = (\n`;
    yearlyData.forEach(item => {
      typstContent += `  (year: ${item.year}, count: ${item.count}),\n`;
    });
    typstContent += `)\n`;

    await Deno.writeTextFile(markdownPath, markdownContent);
    await Deno.writeTextFile(jsonPath, JSON.stringify(jsonData, null, 2));
    await Deno.writeTextFile(typstPath, typstContent);

    // Run typst compile to generate the PDF report
    console.log(colors.blue(`Compiling Typst report...`));
    const reportTypPath = join(typstDir, 'report.typ');
    const reportPdfPath = join(typstDir, 'report.pdf');
    
    try {
      const typstCmd = new Deno.Command('typst', {
        args: ['compile', reportTypPath, reportPdfPath],
        stdout: 'piped',
        stderr: 'piped',
      });
      
      const typstOutput = await typstCmd.output();
      
      if (typstOutput.code === 0) {
        console.log(colors.green(`Typst report compiled successfully: ${reportPdfPath}`));
      } else {
        const errorMessage = new TextDecoder().decode(typstOutput.stderr);
        console.log(colors.yellow(`Warning: Typst report compilation had issues: ${errorMessage}`));
      }
    } catch (typstError) {
      console.log(colors.yellow(`Warning: Could not run typst command: ${typstError.message}`));
      console.log(colors.yellow(`To generate the PDF, manually run: typst compile ${reportTypPath} ${reportPdfPath}`));
    }

    console.log(colors.green(`Analysis complete!`));
    console.log(colors.green(`Markdown file created: ${markdownPath}`));
    console.log(colors.green(`JSON file created: ${jsonPath}`));
    console.log(colors.green(`Typst data file created: ${typstPath}`));

  } catch (error) {
    console.error(colors.red('Error running analysis:'), error.message);
    Deno.exit(1);
  }
}

// Run the analysis function
await runAnalysis();
