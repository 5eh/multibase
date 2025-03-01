# 📊 Kusama Transaction Analysis

A Deno module that analyzes Kusama blockchain transfer data using GraphQL
queries. This serves as the initial analytics component in the MusicGen
pipeline, providing insights into transaction patterns over time and determining
appropriate music styles based on transaction volume using a quintile-based classification system.

## ✨ Features

- Queries blockchain transfer data via GraphQL API
- Processes transaction timestamps to generate monthly statistics
- Identifies trends and patterns in transaction volume
- Determines music style and BPM based on transaction volume using quintile distribution
- Classifies transactions into 5 distinct music genres based on volume
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

No API keys are required for this module. Ensure your GraphQL endpoint is
running at the default location or specify a custom endpoint:

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

The module maps transaction volumes to music styles using a quintile-based approach
that divides the transaction data into five equal groups. This ensures a balanced
distribution of styles across the entire dataset and creates a more intuitive mapping
between blockchain activity and musical representation.

### Quintile-Based Music Genre Classification

| Quintile | Transaction Count Range | Music Style     | BPM Range  | Musical Characteristics                                  |
| -------- | ----------------------- | -------------- | ---------- | ------------------------------------------------------- |
| 1st (Highest) | > 50,000          | Speedcore      | 300-400    | Ultra-fast and chaotic electronic music                  |
| 2nd      | 35,000 - 50,000        | Rock           | 100-140    | Generally faster than Pop, especially in Punk and Metal  |
| 3rd      | 12,000 - 35,000        | Hip-Hop        | 80-120     | Can be slow and groovy or mid-tempo, rarely very fast    |
| 4th      | 5,000 - 12,000         | Reggae         | 60-90      | Relaxed groove with emphasis on offbeat rhythms          |
| 5th (Lowest) | < 5,000            | Drone Ambient  | 20-40      | Extremely slow, focusing on atmosphere over rhythm        |

### BPM Mapping Logic

Transaction counts are mapped to specific BPM values based on their position within quintiles:

1. **Extreme outliers** (> 300,000 transactions): 350 BPM (Speedcore)
2. **First quintile** (> 50,000 transactions): 330 BPM (Speedcore)
3. **Second quintile** (> 35,000 transactions): 130 BPM (Rock)
4. **Third quintile** (> 12,000 transactions): 100 BPM (Hip-Hop)
5. **Fourth quintile** (> 5,000 transactions): 75 BPM (Reggae)
6. **Fifth quintile** (> 1,000 transactions): 50 BPM (Ambient)
7. **Lowest values** (≤ 1,000 transactions): 30 BPM (Drone Ambient)

This quintile-based classification ensures that each music style represents approximately 
20% of the dataset, creating a balanced musical representation of blockchain activity patterns.

## 📝 Example Output

```markdown
# Analysis of Kusama Transactions

## Overview

Total transactions analyzed: **7,613,737**

## Monthly Breakdown by Music Genre

### Speedcore (300+ BPM) - Ultra-fast and chaotic electronic music
November 2024: 4,347,886
September 2021: 207,735
November 2021: 177,266
May 2021: 164,074
June 2021: 161,762

### Rock (100-140 BPM) - Generally faster than Pop, especially in Punk and Metal variations
March 2022: 64,376
January 2022: 63,683
December 2022: 60,880
July 2021: 60,710
November 2022: 54,954

### Hip-Hop (80-120 BPM) - Can be slow and groovy or mid-tempo, but rarely very fast
April 2022: 48,740
February 2022: 48,429
November 2023: 47,402
April 2021: 45,419
April 2023: 45,039

### Reggae (60-90 BPM) - Relaxed groove with emphasis on offbeat rhythms
October 2023: 36,222
August 2023: 35,899
October 2024: 35,258
August 2024: 33,678
July 2024: 32,665

### Drone Ambient (20-40 BPM) - Extremely slow, focusing on atmosphere over rhythm
November 2020: 14,772
May 2020: 12,777
August 2020: 12,717
October 2020: 12,452
July 2020: 9,826

## Key Findings

- Highest transaction volume: **November 2024** with **4,347,886** transactions
  (Speedcore style, 350 BPM)
- Lowest transaction volume: **March 2025** with **223** transactions
  (Drone Ambient style, 30 BPM)
- Transaction volumes show clear patterns with each quintile representing a distinct music genre

This analysis provides insights into the distribution of blockchain transactions
over time using a quintile-based approach to assign appropriate music styles.
```

## 📄 License

MIT
