import { parseArgs } from "jsr:@std/cli/parse-args";
import * as colors from "jsr:@std/fmt/colors";
import { join } from "jsr:@std/path";
import { ensureDir } from "jsr:@std/fs";
import { compileTypst, setupPaths } from "../common/output.js";

// Music style mapping based on transaction volume
const MUSIC_STYLES = [
  {
    name: "Ambient",
    description: "Slow, atmospheric ambient music",
    minBpm: 60,
    maxBpm: 80,
  },
  {
    name: "Chillout",
    description: "Relaxed electronic music",
    minBpm: 80,
    maxBpm: 100,
  },
  {
    name: "Downtempo",
    description: "Mellow electronic beats",
    minBpm: 90,
    maxBpm: 110,
  },
  {
    name: "Trip Hop",
    description: "Moody, atmospheric beats",
    minBpm: 90,
    maxBpm: 110,
  },
  {
    name: "Lo-Fi",
    description: "Relaxed beats with vinyl crackle",
    minBpm: 70,
    maxBpm: 90,
  },
  {
    name: "Jazz",
    description: "Smooth jazz with piano",
    minBpm: 80,
    maxBpm: 120,
  },
  { name: "Folk", description: "Acoustic folk music", minBpm: 90, maxBpm: 120 },
  { name: "Pop", description: "Catchy pop music", minBpm: 100, maxBpm: 130 },
  {
    name: "Indie Rock",
    description: "Alternative rock with indie vibes",
    minBpm: 110,
    maxBpm: 140,
  },
  {
    name: "Rock",
    description: "Energetic rock music",
    minBpm: 120,
    maxBpm: 150,
  },
  {
    name: "Dance",
    description: "Upbeat dance music",
    minBpm: 120,
    maxBpm: 140,
  },
  {
    name: "House",
    description: "Electronic house music",
    minBpm: 120,
    maxBpm: 130,
  },
  {
    name: "Techno",
    description: "Driving electronic beats",
    minBpm: 120,
    maxBpm: 150,
  },
  {
    name: "Drum and Bass",
    description: "Fast-paced electronic music",
    minBpm: 160,
    maxBpm: 180,
  },
  {
    name: "Hardstyle",
    description: "Hard-hitting electronic music",
    minBpm: 150,
    maxBpm: 160,
  },
  {
    name: "Speedcore",
    description: "Extremely fast electronic music",
    minBpm: 180,
    maxBpm: 300,
  },
];

// Parse command line arguments
const args = parseArgs(Deno.args, {
  string: ["output"],
  default: { output: "./output" },
  alias: { o: "output" },
});

// Set up standardized paths
const paths = await setupPaths("00_analysis", args.output);

async function runAnalysis() {
  console.log(colors.blue("Analyzing transaction data..."));

  const url = "http://localhost:4350/graphql";
  const query = `
  query MyQuery {
      transfers {
          timestamp
          blockNumber
      }
  }
  `;

  try {
    // Directories are already ensured by setupPaths

    // First, try to connect to a real GraphQL endpoint
    let response;
    let usedRealData = false;

    try {
      console.log(
        colors.blue(
          "Attempting to connect to real GraphQL endpoint at http://localhost:4350/graphql...",
        ),
      );

      // Use the exact same code as in the notebook, without any timeout or complex error handling
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      // If we get here without an error, we're connected
      console.log(colors.green("✅ Connected to real blockchain data source!"));
      usedRealData = true;
    } catch (connectionError) {
      console.log(
        colors.yellow(
          `⚠️ Could not connect to real GraphQL endpoint: ${connectionError.message}`,
        ),
      );
      console.log(
        colors.yellow(
          "Falling back to mock data for demonstration purposes...",
        ),
      );

      // Generate mock data as a fallback
      const mockData = {
        data: {
          transfers: [],
        },
      };

      // Generate random transactions over a 5-year period
      const startDate = new Date(2019, 10, 1); // November 2019
      const endDate = new Date(2024, 11, 31); // December 2024

      // Generate 15,000 random transactions
      for (let i = 0; i < 15000; i++) {
        const timestamp = new Date(
          startDate.getTime() +
            Math.random() * (endDate.getTime() - startDate.getTime()),
        );
        mockData.data.transfers.push({
          timestamp: timestamp.toISOString(),
          blockNumber: Math.floor(Math.random() * 10000000) + 1000000,
        });
      }

      // Add a spike in January 2021
      const jan2021 = new Date(2021, 0, 1);
      const jan2021End = new Date(2021, 0, 31);
      for (let i = 0; i < 5000; i++) {
        const timestamp = new Date(
          jan2021.getTime() +
            Math.random() * (jan2021End.getTime() - jan2021.getTime()),
        );
        mockData.data.transfers.push({
          timestamp: timestamp.toISOString(),
          blockNumber: Math.floor(Math.random() * 10000000) + 1000000,
        });
      }

      // Add a spike in November 2024
      const nov2024 = new Date(2024, 10, 1);
      const nov2024End = new Date(2024, 10, 30);
      for (let i = 0; i < 8000; i++) {
        const timestamp = new Date(
          nov2024.getTime() +
            Math.random() * (nov2024End.getTime() - nov2024.getTime()),
        );
        mockData.data.transfers.push({
          timestamp: timestamp.toISOString(),
          blockNumber: Math.floor(Math.random() * 10000000) + 1000000,
        });
      }

      // Simulate a response
      response = {
        ok: true,
        json: () => Promise.resolve(mockData),
      };
    }

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.data || !data.data.transfers) {
      throw new Error("No transfer data found in the response");
    }

    // Process the data
    const transactionsByMonth = data.data.transfers.reduce((acc, transfer) => {
      const date = new Date(transfer.timestamp);
      const month = date.toLocaleString("default", { month: "long" });
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
    const highestMonth = monthEntries.reduce(
      (max, entry) => entry[1] > max[1] ? entry : max,
      [null, 0],
    );
    const lowestMonth = monthEntries.reduce(
      (min, entry) => entry[1] < min[1] ? entry : min,
      [null, Infinity],
    );

    // Calculate transaction count range for style mapping
    const maxCount = highestMonth[1];
    const minCount = lowestMonth[1];

    /**
     * Maps transaction count to a BPM value using a logarithmic scale
     * Based on analysis of actual transaction data distribution
     */
    function mapTransactionCountToBpm(count) {
      // Handle special case for extreme outliers
      if (count > 310000) {
        return 220; // Speedcore
      }

      // Map count to BPM using thresholds
      switch (true) {
        case count <= 918:
          return 60;
        case count <= 1200: // Ambient
          return 65;
        case count <= 1600: // Ambient
          return 70;
        case count <= 2100: // Ambient
          return 75;
        case count <= 2700: // Ambient
          return 80;
        case count <= 3600: // Chillout
          return 85;
        case count <= 4700: // Chillout
          return 90;
        case count <= 6100: // Chillout
          return 95;
        case count <= 8000: // Chillout
          return 100;
        case count <= 10500: // Downtempo
          return 105;
        case count <= 13800: // Downtempo
          return 110;
        case count <= 18100: // Jazz
          return 115;
        case count <= 23700: // Jazz
          return 120;
        case count <= 31100: // Pop
          return 125;
        case count <= 40800: // Pop
          return 130;
        case count <= 53500: // Indie Rock
          return 135;
        case count <= 70200: // Indie Rock
          return 140;
        case count <= 92100: // Rock
          return 145;
        case count <= 120800: // Rock
          return 150;
        case count <= 158400: // Hardstyle
          return 155;
        case count <= 207800: // Hardstyle
          return 160;
        default:
          return 160;
      }
    }

    /**
     * Finds the appropriate music style based on a BPM value
     * Prioritizes styles with narrower BPM ranges when multiple match
     */
    function findMusicStyleByBpm(bpm) {
      // Find all styles that include this BPM in their range
      const matchingStyles = MUSIC_STYLES.filter(
        (style) => bpm >= style.minBpm && bpm <= style.maxBpm,
      );

      // If multiple styles match, choose the one with the narrowest range
      if (matchingStyles.length > 0) {
        return matchingStyles.sort((a, b) =>
          (a.maxBpm - a.minBpm) - (b.maxBpm - b.minBpm)
        )[0];
      }

      // Fallback - find closest style
      return MUSIC_STYLES.sort((a, b) => {
        const aDist = Math.min(
          Math.abs(a.minBpm - bpm),
          Math.abs(a.maxBpm - bpm),
        );
        const bDist = Math.min(
          Math.abs(b.minBpm - bpm),
          Math.abs(b.maxBpm - bpm),
        );
        return aDist - bDist;
      })[0];
    }

    // Create sorted data for better presentation
    const sortedMonths = monthEntries
      .map(([monthYear, count]) => {
        const [month, year] = monthYear.split(" ");

        // Determine BPM based on transaction count
        const bpm = mapTransactionCountToBpm(count);

        // Find the appropriate music style based on BPM
        const style = findMusicStyleByBpm(bpm);

        return {
          month,
          year: parseInt(year),
          count,
          musicStyle: style.name,
          musicDescription: style.description,
          bpm,
        };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        const months = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];
        return months.indexOf(a.month) - months.indexOf(b.month);
      });

    // Generate Markdown content
    const tableRows = sortedMonths.map((item) =>
      `| ${item.month} ${item.year} | ${item.count} | ${item.musicStyle} | ${item.bpm} BPM |`
    ).join("\n");

    const markdownContent = `# Analysis of Kusama Transactions

## Overview
Total transactions analyzed: **${totalTransactions}**

## Monthly Breakdown

| Month | Number of Transactions | Music Style | BPM |
|-------|------------------------|-------------|-----|
${tableRows}

## Key Findings
- Highest transaction volume: **${highestMonth[0]}** with **${
      highestMonth[1]
    }** transactions
- Lowest transaction volume: **${lowestMonth[0]}** with **${
      lowestMonth[1]
    }** transactions
- Music styles range from Ambient (low transaction volume) to Speedcore (high volume)

This analysis provides insights into the distribution of Kusama blockchain transactions over time.

*Generated on: ${new Date().toLocaleString()}*
${
      usedRealData
        ? "*Using real blockchain data from GraphQL endpoint*"
        : "*Using synthetic demo data (no GraphQL endpoint available)*"
    }
`;

    // Create JSON data
    const jsonData = {
      totalTransactions,
      highestMonth: {
        period: highestMonth[0],
        count: highestMonth[1],
      },
      lowestMonth: {
        period: lowestMonth[0],
        count: lowestMonth[1],
      },
      monthlyData: sortedMonths.map((item) => ({
        month: item.month,
        year: item.year,
        count: item.count,
        musicStyle: item.musicStyle,
        musicDescription: item.musicDescription,
        bpm: item.bpm,
      })),
    };

    // Write files to simplified locations
    const markdownPath = paths.getOutputPath("analysis.md");
    const jsonPath = paths.getOutputPath("analysis.json");
    const typstDataPath = paths.getTypstPath("data.typ");

    // Also copy the analysis.json to the root output directory if needed
    if (paths.isRunningFromRoot) {
      await Deno.writeTextFile(
        paths.getRootOutputPath("analysis.json"),
        JSON.stringify(jsonData, null, 2),
      );
    }

    // Generate yearly data
    const yearlyData = sortedMonths.reduce((acc, item) => {
      const year = item.year;
      const existingYear = acc.find((y) => y.year === year);

      if (existingYear) {
        existingYear.count += item.count;
      } else {
        acc.push({ year, count: item.count });
      }

      return acc;
    }, []).sort((a, b) => a.year - b.year);

    // Generate Typst content
    let typstContent = `#let totalTransactions = ${totalTransactions}\n`;
    typstContent += `#let highestMonth = (\n  period: "${
      highestMonth[0]
    }",\n  count: ${highestMonth[1]}\n)\n\n`;
    typstContent += `#let lowestMonth = (\n  period: "${
      lowestMonth[0]
    }",\n  count: ${lowestMonth[1]}\n)\n\n`;
    typstContent += `#let usedRealData = ${usedRealData}\n\n`;

    // Save analysis.json to the typst directory for use by report.typ
    await Deno.writeTextFile(
      paths.getTypstPath("analysis.json"),
      JSON.stringify(jsonData, null, 2),
    );

    // Monthly data
    typstContent += `#let monthlyData = (\n`;
    sortedMonths.forEach((item) => {
      typstContent += `  (\n`;
      typstContent += `    month: "${item.month}",\n`;
      typstContent += `    year: ${item.year},\n`;
      typstContent += `    count: ${item.count}`;

      // Only include music style and BPM for key months
      // November 2019 (first month), January 2021 (significant growth), November 2024 (highest spike)
      if (
        (item.month === "November" && item.year === 2019) ||
        (item.month === "January" && item.year === 2021) ||
        (item.month === "November" && item.year === 2024)
      ) {
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
    yearlyData.forEach((item) => {
      typstContent += `  (year: ${item.year}, count: ${item.count}),\n`;
    });
    typstContent += `)\n`;

    await Deno.writeTextFile(markdownPath, markdownContent);
    await Deno.writeTextFile(jsonPath, JSON.stringify(jsonData, null, 2));
    await Deno.writeTextFile(typstDataPath, typstContent);

    // Run typst compile to generate the PDF report
    console.log(colors.blue(`Compiling Typst report...`));
    const reportTemplatePath = paths.getTypstPath("report.typ");
    const reportPdfPath = paths.getOutputPath("report.pdf");

    // Compile using our common utility
    const compileSuccess = await compileTypst(
      reportTemplatePath,
      reportPdfPath,
    );

    // Copy to root output directory if compiled successfully
    if (compileSuccess) {
      await paths.copyToRootOutput("report.pdf", "kusama_analysis_report.pdf");
    }

    console.log(colors.green(`Analysis complete!`));
    console.log(colors.green(`Markdown file created: ${markdownPath}`));
    console.log(colors.green(`JSON file created: ${jsonPath}`));
    console.log(colors.green(`Typst data file created: ${typstDataPath}`));
  } catch (error) {
    console.error(colors.red("Error running analysis:"), error.message);
    Deno.exit(1);
  }
}

// Run the analysis function
await runAnalysis();
