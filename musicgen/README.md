# 🎵 MusicGen - AI Music Generation Pipeline

A complete pipeline that transforms the latest news into original music tracks in three steps:

1. **Get News** - Fetches the latest SpaceX news using Perplexity AI
2. **Make Lyrics** - Transforms news content into creative song lyrics using OpenAI
3. **Create Music** - Generates music tracks from the lyrics using APIBox.ai

## ✨ Features

- End-to-end pipeline from news to music
- Customizable music style, title, and model
- Option for instrumental tracks without lyrics
- Detailed progress tracking
- Command-line interface with various options

## 🔧 Prerequisites

- [Deno](https://deno.com/) runtime installed
- API keys for:
  - Perplexity AI (for news retrieval)
  - OpenAI (for lyrics generation)
  - APIBox.ai (for music creation)

## 🚀 Getting Started

Set your API keys as environment variables:

```bash
export PERPLEXITY_API_KEY="your_perplexity_key_here"
export OPENAI_API_KEY="your_openai_key_here"
export APIBOX_API_KEY="your_apibox_key_here"
```

## 📋 Usage

Basic usage:

```bash
deno run -A musicgen/main.js
```

This will:
1. Search for the latest SpaceX news
2. Generate lyrics based on that news
3. Create a rock song with those lyrics

### Command Line Options

| Option | Description |
|--------|-------------|
| `-q, --query` | News search query (default: "latest SpaceX launch news") |
| `-s, --style` | Music style (default: "Rock") |
| `-t, --title` | Music title (default: "SpaceX Launch") |
| `-m, --model` | Music model (V3_5 or V4) (default: "V3_5") |
| `-i, --instrumental` | Generate instrumental music without lyrics |
| `-v, --verbose` | Show detailed output |
| `-h, --help` | Show help message |

### Examples

Generate music about a specific SpaceX event:
```bash
deno run -A musicgen/main.js --query="SpaceX Starship SN15 landing" --style="Electronic" --title="Starship Landing"
```

Create instrumental music:
```bash
deno run -A musicgen/main.js --instrumental --style="Cinematic" --title="Space Journey"
```

Get detailed output:
```bash
deno run -A musicgen/main.js --verbose
```

## 📁 Project Structure

- `main.js` - Main pipeline script that orchestrates the entire process
- `01_getNews/` - Module for retrieving news content
- `02_makeLyrics/` - Module for generating lyrics from news
- `03_createMusic/` - Module for creating music from lyrics

Each module can also be run independently. See their respective README files for details.

## 🔍 Troubleshooting

- If any step fails, check that your API keys are correctly set
- For detailed error information, run with the `--verbose` flag
- If music generation times out, you can resume using the task ID from `last_task_id.txt`

## 📄 License

MIT
