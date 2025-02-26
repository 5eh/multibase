# 🎵 Song Lyrics Generator

This module takes news content or other textual information and transforms it into creative song lyrics using OpenAI's GPT-4o model. It serves as the second step in the MusicGen pipeline, bridging factual content with musical expression.

## ✨ Features

- Transforms factual news into emotionally resonant song lyrics
- Creates structured lyrics with verses, chorus, and optional bridge/outro sections
- Outputs clean, formatted lyrics ready for musical composition
- Designed to work seamlessly with content from the 01_getNews module
- Functions both independently and as part of the MusicGen pipeline

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
# Basic usage
deno run -A index.js --context="your markdown formatted content"

# Using short form argument
deno run -A index.js -c="your markdown formatted content"

# Piping content from the news module
deno run -A ../01_getNews/index.js -q="SpaceX launch" | deno run -A index.js --context="$(cat)"
```

### As Part of MusicGen Pipeline

This module is automatically called by the main pipeline script:

```bash
deno run -A ../../main.js
```

## ⚙️ How It Works

1. The script receives markdown-formatted content through the `--context` parameter
2. It sends this content to the OpenAI API with specialized prompting to guide lyric creation
3. The AI generates creative, structured lyrics that capture the essence of the input content
4. The script outputs the formatted lyrics, ready for downstream use in music composition

## 🔄 Integration

This module is designed as the middle step in a three-part pipeline:

1. **News Fetcher** - Retrieves factual content about SpaceX or other topics
2. **Lyrics Generator** (this module) - Transforms content into lyrics
3. **Music Creator** - Generates music with the lyrics

## 📝 Example

### Input (news content):
```
SpaceX has been busy with several recent launches:

1. Starlink Launch: SpaceX launched 23 Starlink satellites to low Earth orbit using a Falcon 9 rocket.
2. Crew-8 Mission: SpaceX is preparing for the Crew-8 mission to the International Space Station.
3. Starship Testing: SpaceX is continuing development of its Starship vehicle.
```

### Output (lyrics):
```
**(Verse 1)**  
Rocket's flame lights up the night,  
Breaking through the veil of sky,  
A dance of stars in silent flight,  
Reaching for dreams that never die.  

**(Chorus)**  
Starlink constellations glow,  
Connecting worlds we've yet to know,  
SpaceX soaring, watch it go,  
The future's written in this show.

**(Verse 2)**  
Crew-8 heroes, brave and bold,  
Their stories waiting to be told,  
In station's orbit, life unfolds,  
A testament to dreams of old.

**(Bridge)**  
Starship rising, testing fate,  
Innovation can't wait,  
Breaking barriers, creating gates,  
To worlds we'll soon navigate.

**(Chorus)**  
Starlink constellations glow,  
Connecting worlds we've yet to know,  
SpaceX soaring, watch it go,  
The future's written in this show.
```
