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

## 🎵 Transaction-to-Music Mapping

The module maps transaction volumes to music styles using a logarithmic scale that better reflects the natural distribution of transaction data. First, transaction counts are mapped to BPM values, then music styles are determined based on those BPM values. This approach ensures a balanced distribution of styles across the dataset.

### Transaction Count to BPM Mapping

| Transaction Count Range | BPM Value | Potential Music Styles |
|-------------------------|-----------|------------------------|
| ≤ 918                   | 60        | Ambient                |
| 919 - 1,200             | 65        | Ambient                |
| 1,201 - 1,600           | 70        | Ambient, Lo-Fi         |
| 1,601 - 2,100           | 75        | Ambient, Lo-Fi         |
| 2,101 - 2,700           | 80        | Ambient, Chillout, Jazz|
| 2,701 - 3,600           | 85        | Chillout, Jazz         |
| 3,601 - 4,700           | 90        | Chillout, Lo-Fi, Jazz, Folk, Downtempo, Trip Hop |
| 4,701 - 6,100           | 95        | Chillout, Folk, Downtempo, Trip Hop |
| 6,101 - 8,000           | 100       | Chillout, Folk, Pop, Downtempo, Trip Hop |
| 8,001 - 10,500          | 105       | Folk, Pop, Downtempo, Trip Hop |
| 10,501 - 13,800         | 110       | Folk, Pop, Indie Rock, Downtempo, Trip Hop |
| 13,801 - 18,100         | 115       | Folk, Pop, Indie Rock, Jazz |
| 18,101 - 23,700         | 120       | Pop, Indie Rock, Rock, Dance, House, Techno |
| 23,701 - 31,100         | 125       | Pop, Indie Rock, Rock, Dance, House, Techno |
| 31,101 - 40,800         | 130       | Pop, Indie Rock, Rock, Dance, House, Techno |
| 40,801 - 53,500         | 135       | Indie Rock, Rock, Dance, Techno |
| 53,501 - 70,200         | 140       | Indie Rock, Rock, Dance, Techno |
| 70,201 - 92,100         | 145       | Rock, Techno |
| 92,101 - 120,800        | 150       | Rock, Techno, Hardstyle |
| 120,801 - 158,400       | 155       | Hardstyle |
| 158,401 - 207,800       | 160       | Hardstyle, Drum and Bass |
| > 310,000               | 220       | Speedcore |

### Style Selection Logic

When multiple music styles match a given BPM value, the system selects the most appropriate style using these rules:

1. Styles with narrower BPM ranges are prioritized (more specialized styles)
2. When no exact match is found, the style with the closest BPM range is selected

This sophisticated mapping approach was derived from statistical analysis of the transaction data distribution, ensuring both variety and appropriate musical representation of blockchain activity.

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