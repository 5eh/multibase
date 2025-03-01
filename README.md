# 🎵 BlockBeats - Propaganda as a Service

BlockBeats transforms blockchain data into music, visualizations, and narrative content, providing a unique sensory experience of blockchain activity.

## 🚀 Overview

BlockBeats is an innovative platform that captures blockchain transaction data and transforms it into musical compositions, visual experiences, and narrative content. By analyzing transaction patterns and volumes from the Kusama blockchain, we generate music whose style, tempo, and mood reflect the blockchain's activity - creating "Propaganda as a Service."

## ✨ Core Components

BlockBeats consists of several interconnected components:

1. **Indexer**: Captures and indexes Kusama blockchain transactions
2. **Transaction Analysis**: Determines music styles based on transaction patterns
3. **News Fetcher**: Retrieves historical blockchain news for context
4. **Lyrics Generator**: Creates narrative content from blockchain data
5. **Music Creator**: Composes music reflecting transaction patterns
6. **Thumbnail Generator**: Creates visual album artwork
7. **Frontend Lab (FLAB)**: Interactive web interface for exploring the music

## 🎧 How It Works

1. **Data Collection**: We index the Kusama blockchain and analyze transaction patterns
2. **Music Mapping**: Transaction volumes determine musical attributes:
   - Higher volumes create faster, more energetic music (up to 350 BPM Speedcore)
   - Lower volumes create slower, ambient pieces (as low as 30 BPM Drone Ambient)
   - Five distinct musical genres across the volume spectrum
3. **Content Generation**: We generate news summaries, lyrics, and music that tell the blockchain's story
4. **Interactive Experience**: Users can explore the blockchain's musical history through our visualization interface

## 🛠️ Technology Stack

- **Indexer**: Subsquid, Node.js, PostgreSQL, GraphQL
- **Analysis & Generation**: Deno, OpenAI API, Perplexity AI, APIBox.ai
- **Visualization**: Three.js, WebGL, HTML5 Audio API
- **Frontend**: Vanilla JavaScript, CSS animations
- **Deployment**: Netlify, Subsquid Cloud

## 🚀 Getting Started

### Running the Complete System

```bash
# 1. Start the indexer
cd indexer
npm i
sqd up
sqd build
sqd run .

# 2. Generate music (requires API keys)
cd ../musicgen
deno run -A main.js --month="January" --year="2021"

# 3. Run the frontend
cd ../flab
deno run -A jsr:@std/http/file-server .
```

Visit `http://localhost:4507` to experience the BlockBeats interface.

### API Keys Required

To generate content, you'll need:
- Perplexity AI API key (news retrieval)
- OpenAI API key (lyrics generation)
- APIBox.ai API key (music creation)
- Blackforest Lab API key (thumbnail generation)

## 📊 Data to Music Mapping

BlockBeats uses a quintile-based classification system to map transaction volumes to music styles:

| Quintile | Transaction Range | Music Style     | BPM Range | Characteristics                           |
|----------|-------------------|-----------------|-----------|-------------------------------------------|
| Highest  | > 50,000          | Speedcore       | 300-400   | Ultra-fast, chaotic electronic music      |
| 2nd      | 35,000-50,000     | Rock            | 100-140   | Energetic, driving rhythms                |
| 3rd      | 12,000-35,000     | Hip-Hop         | 80-120    | Mid-tempo with strong beats               |
| 4th      | 5,000-12,000      | Reggae          | 60-90     | Relaxed groove with offbeat rhythms       |
| Lowest   | < 5,000           | Drone Ambient   | 20-40     | Slow, atmospheric, minimal rhythm         |

## 🔍 Project Structure

- `/indexer/` - Blockchain data indexing and GraphQL API
- `/musicgen/` - Music generation pipeline
  - `/00_analysis/` - Transaction data analysis
  - `/01_getNews/` - News retrieval
  - `/02_makeLyrics/` - Lyrics generation
  - `/03_createMusic/` - Music composition
  - `/04_createThumbnail/` - Album art creation
- `/flab/` - Frontend visualization interface
- `/frontend/` - Next.js-based application (in development)

## 📄 License

This project is licensed under the terms specified in the LICENSE file.