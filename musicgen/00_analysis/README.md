# =Ê Transaction Analysis

A Deno module that analyzes blockchain transfer data using GraphQL queries. This serves as the initial analytics component in the MusicGen pipeline, providing insights into transaction patterns over time.

## ( Features

- Queries blockchain transfer data via GraphQL API
- Processes transaction timestamps to generate monthly statistics
- Identifies trends and patterns in transaction volume
- Generates both Markdown and JSON output formats
- Provides visualized transaction data using a Jupyter notebook
- Designed to work both independently and within the MusicGen pipeline

## =' Prerequisites

- [Deno](https://deno.land/) installed
- Running GraphQL endpoint (default: http://localhost:4350/graphql)
- Optional: Jupyter notebook environment for interactive analysis

## =Ë Usage

### Standalone Usage

Run the analysis script with optional output directory:

```bash
deno run -A index.js --output=./custom-output
```

Or use the short form:

```bash
deno run -A index.js -o=./custom-output
```

### Interactive Analysis

For interactive exploration, open the Jupyter notebook:

```bash
jupyter notebook notebook.ipynb
```

## ™ Parameters

- `output` or `o`: Directory for output files (default: "./output")

## =ä Output

The module generates:
- `analysis.md`: Markdown report with tables and key findings
- `analysis.json`: Structured JSON data for programmatic use

The output includes:
- Total number of transactions
- Monthly breakdown of transaction volume
- Highest and lowest transaction periods
- Time-based transaction distribution

## = Integration

This analysis module fits into the MusicGen pipeline as follows:

1. **Transaction Analysis** (this module) - Analyzes blockchain data
2. **News Fetcher** - Retrieves factual content related to blockchain activity
3. **Lyrics Generator** - Transforms insights into creative lyrics
4. **Music Creator** - Generates music based on the analysis and lyrics

## =Ý Example Output

```markdown
# Analysis of Transactions

## Overview
Total transactions analyzed: **7,611,934**

## Monthly Breakdown

| Month | Number of Transactions |
|-------|------------------------|
| November 2019 | 918 |
| December 2019 | 7,699 |
| January 2020 | 2,164 |
...

## Key Findings
- Highest transaction volume: **November 2024** with **4,347,886** transactions
- Lowest transaction volume: **November 2019** with **918** transactions

This analysis provides insights into the distribution of blockchain transactions over time.
```