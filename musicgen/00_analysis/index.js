import { parseArgs } from "jsr:@std/cli/parse-args";
import * as colors from "jsr:@std/fmt/colors";
import { join } from "jsr:@std/path";
import { ensureDir } from "jsr:@std/fs";


// Parse command line arguments
const args = parseArgs(Deno.args, {
  string: ["output"],
  default: { output: "./output" },
  alias: { o: "output" },
});

const outputDir = args.output;

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

    // Create sorted data for better presentation
    const sortedMonths = monthEntries
      .map(([monthYear, count]) => {
        const [month, year] = monthYear.split(' ');
        return { month, year: parseInt(year), count };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'];
        return months.indexOf(a.month) - months.indexOf(b.month);
      });

    // Generate Markdown content
    const tableRows = sortedMonths.map(item =>
      `| ${item.month} ${item.year} | ${item.count} |`
    ).join('\n');

    const markdownContent = `# Analysis of Transactions

## Overview
Total transactions analyzed: **${totalTransactions}**

## Monthly Breakdown

| Month | Number of Transactions |
|-------|------------------------|
${tableRows}

## Key Findings
- Highest transaction volume: **${highestMonth[0]}** with **${highestMonth[1]}** transactions
- Lowest transaction volume: **${lowestMonth[0]}** with **${lowestMonth[1]}** transactions

This analysis provides insights into the distribution of blockchain transactions over time.

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
        count: item.count
      }))
    };

    // Write files
    const markdownPath = join(outputDir, 'analysis.md');
    const jsonPath = join(outputDir, 'analysis.json');

    await Deno.writeTextFile(markdownPath, markdownContent);
    await Deno.writeTextFile(jsonPath, JSON.stringify(jsonData, null, 2));

    console.log(colors.green(`Analysis complete!`));
    console.log(colors.green(`Markdown file created: ${markdownPath}`));
    console.log(colors.green(`JSON file created: ${jsonPath}`));

  } catch (error) {
    console.error(colors.red('Error running analysis:'), error.message);
    Deno.exit(1);
  }
}

// Run the analysis function
await runAnalysis();
