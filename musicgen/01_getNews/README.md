# News Fetcher

A simple Deno script that fetches the latest news and information using the Perplexity API.

## Features

- Searches for news using a custom query
- Uses Perplexity's Sonar Pro model for high-quality, up-to-date responses
- Returns concise, accurate information with recent results (past 24 hours)

## Prerequisites

- [Deno](https://deno.land/) installed
- Perplexity API key

## Environment Setup

Set your Perplexity API key as an environment variable:

```bash
export PERPLEXITY_API_KEY="your-api-key-here"
```

## Usage

Run the script with your search query:

```bash
deno run -A index.js --query="Latest news on quantum computing"
```

Or use the short form:

```bash
deno run -A index.js -q="Latest news on quantum computing"
```

## Parameters

- `query` or `q`: Your search query (required)

## Output

The script will return concise, factual information based on your query, focusing on recent news from the past day.
