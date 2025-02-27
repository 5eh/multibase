# 📊 Kusama Transaction Analysis

A Deno module that analyzes Kusama blockchain transfer data using GraphQL queries. This serves as the initial analytics component in the MusicGen pipeline, providing insights into transaction patterns over time and determining appropriate music styles based on transaction volume.

## ✨ Features

- Queries blockchain transfer data via GraphQL API
- Processes transaction timestamps to generate monthly statistics
- Identifies trends and patterns in transaction volume
- Determines music style and BPM based on transaction volume
- Generates both Markdown and JSON output formats
- Creates beautiful PDF reports using Typst
- Provides visualized transaction data using a Jupyter notebook
- Designed to work both independently and within the MusicGen pipeline

## 🔧 Prerequisites

- [Deno](https://deno.land/) installed
- Running GraphQL endpoint (default: http://localhost:4350/graphql)
- Typst (for PDF report generation)
- Optional: Jupyter notebook environment for interactive analysis

## 🔑 Environment Setup

No API keys are required for this module. Ensure your GraphQL endpoint is running at the default location or specify a custom endpoint:

```bash
export GRAPHQL_ENDPOINT="http://your-custom-endpoint:4350/graphql"
```

## 📋 Usage

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

## ⚙️ Parameters

- `output` or `o`: Directory for output files (default: "./output")

## 📤 Output

The module generates:
- `analysis.md`: Markdown report with tables and key findings
- `analysis.json`: Structured JSON data for programmatic use
- `typst_report/report.pdf`: Beautifully formatted PDF report
- `typst_report/data.typ`: Typst data file for the report

The output includes:
- Total number of transactions
- Monthly breakdown of transaction volume
- Highest and lowest transaction periods
- Time-based transaction distribution
- Music style and BPM recommendations based on transaction volume

## 🔄 Integration

This analysis module fits into the MusicGen pipeline as follows:

1. **Transaction Analysis** (this module) - Analyzes blockchain data
2. **News Fetcher** - Retrieves historical news about Kusama blockchain
3. **Lyrics Generator** - Transforms insights into creative lyrics
4. **Music Creator** - Generates music based on the analysis and lyrics
5. **Thumbnail Generator** - Creates album cover art for the generated music

## 📝 Example Output

```markdown
# Analysis of Kusama Transactions

## Overview
Total transactions analyzed: **7,611,934**

## Monthly Breakdown

| Month | Number of Transactions | Music Style | BPM |
|-------|------------------------|-------------|-----|
| November 2019 | 918 | Ambient | 60 |
| December 2019 | 7,699 | Lo-Fi | 72 |
| January 2020 | 2,164 | Chillout | 85 |
...
| January 2021 | 15,243 | Dance | 128 |
...

## Key Findings
- Highest transaction volume: **November 2024** with **4,347,886** transactions (Techno style, 150 BPM)
- Lowest transaction volume: **November 2019** with **918** transactions (Ambient style, 60 BPM)

This analysis provides insights into the distribution of blockchain transactions over time and suggests appropriate music styles based on activity levels.
```

## 📄 License

MIT