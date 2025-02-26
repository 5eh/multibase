# 📰 News Fetcher

A Deno script that fetches the latest news and information using the Perplexity AI API. This module serves as the first step in the MusicGen pipeline, providing factual content that will be transformed into lyrics and music.

## ✨ Features

- Searches for news using a custom query
- Uses Perplexity's Sonar Pro model for high-quality, up-to-date responses
- Returns concise, accurate information with recent results (past 24 hours)
- Colorized output for better readability
- Designed to work both independently and as part of the MusicGen pipeline

## 🔧 Prerequisites

- [Deno](https://deno.land/) installed
- Perplexity AI API key

## 🔑 Environment Setup

Set your Perplexity API key as an environment variable:

```bash
export PERPLEXITY_API_KEY="your-perplexity-key-here"
```

## 📋 Usage

### Standalone Usage

Run the script with your search query:

```bash
deno run -A index.js --query="Latest news on SpaceX launches"
```

Or use the short form:

```bash
deno run -A index.js -q="Latest news on SpaceX launches"
```

### As Part of MusicGen Pipeline

This module is automatically called by the main pipeline script:

```bash
deno run -A ../../main.js
```

## ⚙️ Parameters

- `query` or `q`: Your search query (required)

## 📤 Output

The script outputs:
- A colorized display of the search query
- The retrieved news content with a "Result:" header
- Factual, concise information focused on recent news (past day)

When used in the pipeline, this output is passed to the lyrics generation module.

## 🔄 Integration

This module is designed as the first step in a three-part pipeline:

1. **News Fetcher** (this module) - Retrieves factual content
2. **Lyrics Generator** - Transforms content into lyrics
3. **Music Creator** - Generates music with the lyrics

## 📝 Example Output

```
Searching: "latest SpaceX launch news"

Result:
SpaceX has been busy with several recent and upcoming launches:

1. Starlink Launch: SpaceX launched 23 Starlink satellites to low Earth orbit using a Falcon 9 rocket. The rocket successfully landed on the "Just Read the Instructions" droneship in the Atlantic Ocean.

2. Crew-8 Mission: SpaceX is preparing for the Crew-8 mission to the International Space Station, scheduled for early March 2024.

3. Starship Testing: SpaceX is continuing development of its Starship vehicle, with preparations for the next test flight following previous partial successes.

4. Commercial Launches: SpaceX continues to deploy satellites for various commercial customers alongside its Starlink constellation.

The company maintains its position as the world's most active launch provider, with dozens of missions planned for 2024.
```
