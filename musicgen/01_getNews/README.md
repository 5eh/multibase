# 📰 Kusama News Fetcher

A Deno script that fetches historical news and information about the Kusama blockchain using the Perplexity AI API. This module serves as the second step in the MusicGen pipeline, providing factual content that will be transformed into lyrics and music.

## ✨ Features

- Searches for Kusama blockchain news by month and year
- Generates comprehensive news articles for historical Kusama events
- Uses Perplexity's Sonar Pro model for high-quality responses
- Optional OpenAI integration to optimize content for newspaper layout
- Returns structured articles with references and citations
- Creates professional newspaper-style PDF using Typst
- Colorized output for better readability
- Designed to work both independently and as part of the MusicGen pipeline

## 🔧 Prerequisites

- [Deno](https://deno.land/) installed
- Perplexity AI API key (required)
- OpenAI API key (optional, for enhanced content structuring)
- [Typst](https://typst.app/) installed (for PDF newspaper generation) - can be installed with `cargo install typst-cli`
- pdfinfo and pdftk (optional, for PDF post-processing to ensure single-page output)

## 🔑 Environment Setup

Set your API keys as environment variables:

```bash
# Required
export PERPLEXITY_API_KEY="your-perplexity-key-here"

# Optional - for enhanced newspaper content structuring
export OPENAI_API_KEY="your-openai-key-here"
```

## 📋 Usage

### Standalone Usage

Run the script with month and year:

```bash
deno run -A index.js --month="January" --year="2021"
```

Or use the short form:

```bash
deno run -A index.js -m="January" -y="2021"
```

You can also use a custom query:

```bash
deno run -A index.js --query="Latest Kusama parachain auction results"
```

### As Part of MusicGen Pipeline

This module is automatically called by the main pipeline script:

```bash
deno run -A ../../main.js --month="January" --year="2021"
```

## ⚙️ Parameters

- `month` or `m`: Month to search for (e.g., "January")
- `year` or `y`: Year to search for (e.g., "2021")
- `query` or `q`: Custom search query (alternative to month/year)

## 📤 Output

The script outputs:
- A colorized display of the search query or month/year
- The retrieved news content with a "Result:" header
- A Markdown file with the news content saved to the output directory
- A beautifully formatted PDF newspaper generated from the content (requires Typst)

For month/year searches, the output is structured as a comprehensive news article about Kusama for that time period, including:
- Headlines and key events
- Development updates
- Market performance
- Governance activities
- References and citations

The newspaper-style PDF includes:
- Professional newspaper layout with masthead
- Two-column article format
- Section headers for different news topics
- Styled conclusion section

## 🔄 Integration

This module is designed as part of the MusicGen pipeline:

1. **Transaction Analysis** - Analyzes blockchain data
2. **News Fetcher** (this module) - Retrieves historical news about Kusama
3. **Lyrics Generator** - Transforms content into creative lyrics
4. **Music Creator** - Generates music with the lyrics
5. **Thumbnail Generator** - Creates album cover art for the generated music

## 📝 Example Output

```
Searching for Kusama news from: January 2021

Result:
# Kusama Network: January 2021 in Review

January 2021 marked a significant month for the Kusama Network as it continued its journey as Polkadot's canary network, setting the stage for parachain functionality and experiencing notable market developments.

## Technical Developments

The Kusama development team focused intensely on preparing the network for parachain functionality throughout January. Engineers worked on finalizing the auction mechanism that would later be used to allocate parachain slots on the network [1]. These preparations were critical as Kusama would serve as the testing ground before similar features would be implemented on Polkadot.

On January 13, 2021, Kusama successfully upgraded to runtime version 2027, which included various improvements to the underlying infrastructure [2]. This upgrade enhanced the network's stability and laid additional groundwork for the upcoming parachain functionality.

...

## References

[1] "Polkadot and Kusama's Parachain Auction Mechanism", Gavin Wood, January 2021, https://polkadot.network/blog/polkadot-parachain-auctions - Detailed explanation of the auction mechanism design and implementation plans.

[2] "Kusama Network Runtime Upgrade v2027", Parity Technologies, January 13, 2021, https://kusama.polkassembly.io/post/505 - Technical details about the runtime upgrade and its implications.

...
```

## 📄 License

MIT