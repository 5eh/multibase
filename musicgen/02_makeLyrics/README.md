# 🎵 Kusama Song Lyrics Generator

This module takes Kusama blockchain news content and transforms it into creative song lyrics using OpenAI's GPT-4o model. It serves as the third step in the MusicGen pipeline, bridging factual content with musical expression.

## ✨ Features

- Transforms Kusama blockchain news into emotionally resonant song lyrics
- Creates structured lyrics with verses and chorus sections
- Incorporates blockchain terminology and Kusama-specific references
- Includes the specific month and year in the lyrics when provided
- Outputs clean, formatted lyrics ready for musical composition
- Designed to work seamlessly with content from the 01_getNews module

## 🔧 Prerequisites

- [Deno](https://deno.land/) runtime environment
- OpenAI API key
- @std/cli and @openai/openai packages from JSR

## 🔑 Environment Setup

Set your OpenAI API key as an environment variable:

```bash
export OPENAI_API_KEY="your-openai-key-here"
```

## 📋 Usage

### Standalone Usage

```bash
# Basic usage with context only
deno run -A index.js --context="your markdown formatted content"

# With month and year specification
deno run -A index.js --context="your markdown formatted content" --month="January" --year="2021"

# Using short form arguments
deno run -A index.js -c="your markdown formatted content" -m="January" -y="2021"

# Piping content from the news module
deno run -A ../01_getNews/index.js -m="January" -y="2021" | deno run -A index.js --context="$(cat)" --month="January" --year="2021"
```

### As Part of MusicGen Pipeline

This module is automatically called by the main pipeline script:

```bash
deno run -A ../../main.js --month="January" --year="2021"
```

## ⚙️ Parameters

- `-c, --context`: Markdown-formatted content to transform into lyrics (required)
- `-m, --month`: Month to reference in the lyrics (e.g., "January")
- `-y, --year`: Year to reference in the lyrics (e.g., "2021")
- `-h, --help`: Show help message

## 📤 Output

The module generates:
- Formatted lyrics with multiple verses and chorus sections
- Lyrics that incorporate blockchain terminology and Kusama references
- Content that captures the essence of the input while adding creative elements
- A markdown file saved to the output directory with naming format `kusama_[month]_[year]_lyrics.md`

## 🔄 Integration

This module is designed as part of the MusicGen pipeline:

1. **Transaction Analysis** - Analyzes blockchain data
2. **News Fetcher** - Retrieves historical news about Kusama blockchain
3. **Lyrics Generator** (this module) - Transforms content into creative lyrics
4. **Music Creator** - Generates music using the lyrics
5. **Thumbnail Generator** - Creates album cover art for the music

## 📝 Example

### Input (news content):
```
# Kusama Network: January 2021 in Review

January 2021 marked a significant month for the Kusama Network as it continued its journey as Polkadot's canary network, setting the stage for parachain functionality and experiencing notable market developments.

The Kusama development team focused intensely on preparing the network for parachain functionality throughout January. Engineers worked on finalizing the auction mechanism that would later be used to allocate parachain slots on the network.
```

### Output (lyrics):
```
(Verse 1)
Digital canaries in the blockchain mine
Testing grounds where innovations shine
January's dawn, a new year begins
Kusama's network steadily spins

(Chorus)
Parachain dreams in the making
A web of nodes, never breaking
January 2021, the future unfolds
Kusama rising, a story untold

(Verse 2)
Engineers craft the auction stage
Writing history, page by page
The canary sings its watchful tune
As moonbeams dance by code cocoon

(Bridge)
In the shadow of Polkadot's plan
A network evolves, block by block
Market tides rise with every scan
Unlocking value from the clock

(Chorus)
Parachain dreams in the making
A web of nodes, never breaking
January 2021, the future unfolds
Kusama rising, a story untold
```

## 📄 License

MIT