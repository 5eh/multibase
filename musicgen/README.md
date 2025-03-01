# 🎵 MusicGen - AI Music Generator for Kusama Blockchain

A complete pipeline that transforms Kusama blockchain transaction data into
original music tracks in five steps:

1. **Transaction Analysis** - Analyzes blockchain data for insights and trends
2. **Get News** - Fetches historical news about Kusama for a specific month/year
3. **Make Lyrics** - Transforms blockchain data and news into creative song
   lyrics
4. **Create Music** - Generates music tracks with style based on transaction
   volume
5. **Create Thumbnail** - Generates album cover art for the music tracks

## ✨ Features

- End-to-end pipeline from blockchain data to music
- Musical style determined by transaction volume patterns
- Process a single month, an entire year, or all available months
- Batch processing with detailed logging
- Customizable music BPM, model, and title
- Option for instrumental tracks without lyrics
- Detailed transaction analysis reports in PDF format
- Command-line interface with various options

## 🔧 Prerequisites

- [Deno](https://deno.com/) runtime installed
- API keys for:
  - Perplexity AI (for news retrieval)
  - OpenAI (for lyrics generation and prompt enhancement)
  - APIBox.ai (for music creation)
  - Blackforest Lab (for thumbnail generation)

## 🚀 Getting Started

Set your API keys as environment variables:

```bash
export PERPLEXITY_API_KEY="your_perplexity_key_here"
export OPENAI_API_KEY="your_openai_key_here"
export APIBOX_API_KEY="your_apibox_key_here"
export BFL_API_KEY="your_blackforest_lab_key_here"
```

## 📋 Usage

Basic usage:

```bash
deno run -A musicgen/main.js
```

This will:

1. Load blockchain transaction analysis data
2. Search for Kusama news from the earliest month in the data
3. Generate lyrics based on that news
4. Create music with style based on transaction volume
5. Generate album cover thumbnail for the track

### Command Line Options

| Option                   | Description                                       |
| ------------------------ | ------------------------------------------------- |
| `-m, --month`            | Month to analyze (e.g., "January")                |
| `-y, --year`             | Year to analyze (e.g., "2021")                    |
| `-p, --process-year`     | Process all months for a specific year            |
| `-l, --loop-all-months`  | Process all months in chronological order         |
| `-t, --title`            | Music title (default: "Kusama <Month> <Year>")    |
| `-d, --model`            | Music model: V3_5 or V4 (default: V3_5)           |
| `-i, --instrumental`     | Generate instrumental music without lyrics        |
| `-v, --verbose`          | Show detailed output                              |
| `-s, --skip-analysis`    | Skip analysis step (use existing analysis.json)   |
| `-h, --help`             | Show help message                                 |

### Examples

Generate music for a specific month and year:

```bash
deno run -A musicgen/main.js --month="January" --year="2021"
```

Process all months for a specific year:

```bash
deno run -A musicgen/main.js --process-year="2021"
```

Process all months from the analysis data in chronological order:

```bash
deno run -A musicgen/main.js --loop-all-months
```

Create instrumental music:

```bash
deno run -A musicgen/main.js --month="January" --year="2021" --instrumental
```

Get detailed output:

```bash
deno run -A musicgen/main.js --verbose
```

## 📁 Project Structure

- `main.js` - Main pipeline script that orchestrates the entire process
- `common/` - Shared utilities used across modules
- Each module follows a simple standardized structure:
  - `XX_moduleName/` - Module directory
    - `index.js` - Module entry point
    - `typst/` - Typst templates and data for document generation
    - `input/` - Input files used by the module
    - `output/` - All generated files (PDFs, JSON, MD, images, audio, etc.)

### Modules

- `00_analysis/` - Analyzes blockchain transaction data
- `01_getNews/` - Retrieves news content about Kusama
- `02_makeLyrics/` - Generates lyrics from news
- `03_createMusic/` - Creates music from lyrics
- `04_createThumbnail/` - Generates album cover art

Each module can also be run independently. See their respective README files for
details.

## 📤 Output

The complete pipeline generates the following files in the `output` directory:

- `kusama_analysis_report.pdf` - PDF report of blockchain transaction analysis
- `kusama_[month]_[year]_newspaper.pdf` - PDF newspaper with historical news
- `kusama_[month]_[year]_news.md` - The retrieved news content in markdown
  format
- `kusama_[month]_[year]_lyrics.md` - The generated lyrics
- `kusama_[month]_[year]_lyrics.pdf` - PDF formatted version of the lyrics
- `kusama_[month]_[year]_music_1.mp3` - The first generated music track
- `kusama_[month]_[year]_music_2.mp3` - The second generated music track
  (variation)
- `kusama_[month]_[year]_cover.png` - The album cover thumbnail
- `analysis.json` - Blockchain transaction analysis data
- `logs.txt` - Detailed processing logs (created when using --loop-all-months or --process-year)

## 🔄 Integration

The MusicGen pipeline consists of five integrated modules:

1. **Transaction Analysis** - Analyzes blockchain data for insights
2. **News Fetcher** - Retrieves historical news about Kusama blockchain
3. **Lyrics Generator** - Transforms content into creative lyrics
4. **Music Creator** - Generates music using the lyrics with style based on
   transaction volume
5. **Thumbnail Generator** - Creates album cover art for the music

## 📝 Example Output

```
🎵 Starting Kusama MusicGen Pipeline 🎵

Step 1/4: Loading Kusama blockchain transaction data...
✅ Analysis data loaded successfully!
Selected month: January 2021
Transaction count: 15,243
Music style: Dance (128 BPM)

Step 2/4: Getting Kusama news for the selected month...
✅ News retrieved successfully!
Preview:
In January 2021, Kusama (KSM) experienced significant developments:

1. Parachain Auctions Preparation: The Kusama network began preparing for its first parachain slot auctions...

Step 3/4: Generating lyrics based on the news...
✅ Lyrics generated successfully!
Preview:
(Verse 1)
Digital canaries in the blockchain mine
Testing grounds where innovations shine
January's dawn, a new year begins
Kusama's network steadily spins

...

Step 4/4: Creating music...
✅ Task created successfully! Task ID: a4bc93b000b68ac221efea9e087042b9
✅ Music generation complete!
Found 2 tracks
✅ Music saved to ./kusama_january_2021_1.mp3
✅ Music saved to ./kusama_january_2021_2.mp3

Step 5/5: Creating thumbnail image...
✅ Image generation complete!
💾 Thumbnail saved to: ./output/kusama_january_2021_cover.png

✅ Pipeline completed successfully!
Your Kusama January 2021 music and thumbnail have been created.
Style: Dance (128 BPM)
Based on 15,243 transactions
```

## 🔍 Troubleshooting

- If any step fails, check that your API keys are correctly set
- For detailed error information, run with the `--verbose` flag
- When using batch processing (--loop-all-months or --process-year), check the logs.txt file for detailed information
- If music generation times out, you can resume using the task ID from
  `last_task_id.txt`

## 📄 License

MIT
