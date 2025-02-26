# Song Lyrics Generator

This module takes news content or other textual information and transforms it into song lyrics.

## Overview

The `index.js` script is a powerful text-to-lyrics converter that utilizes OpenAI's GPT-4o model to generate creative song lyrics based on provided content. It's designed to be used either independently or as part of a larger music generation pipeline.

## Features

- Transforms factual content into emotionally resonant song lyrics
- Creates structured lyrics with verses, chorus, and optional bridge/outro sections
- Outputs clean, unformatted lyrics ready for musical composition
- Designed to work seamlessly with content from the 01_getNews module

## Usage

```bash
# Basic usage
deno run -A index.js --context="your markdown formatted content"

# Using short form argument
deno run -A index.js -c="your markdown formatted content"

# Piping content from another script
deno run -A ../01_getNews/index.js [args] | deno run -A index.js --context="$(cat)"
```

## Requirements

- Deno runtime environment
- OpenAI API key (set as environment variable `OPENAI_API_KEY`)
- @std/cli and @openai/openai packages from JSR

## How It Works

1. The script receives markdown-formatted content through the `--context` parameter
2. It sends this content to the OpenAI API with specialized prompting to guide lyric creation
3. The AI generates creative, structured lyrics that capture the essence of the input content
4. The script outputs only the raw lyrics, ready for downstream use in music composition

## Integration

This module is designed to be part of a multi-stage music generation pipeline:

1. **01_getNews** - Collects and formats news content
2. **02_makeLyrics** (this module) - Transforms content into lyrics
3. Subsequent modules - Create music composition, vocals, etc.

## Example

Input (news content):
```
# Breaking: SpaceX Successfully Launches Starship on Historic Mars Mission

In a milestone achievement for human spaceflight, SpaceX has successfully launched 
its Starship rocket on a trajectory toward Mars...
```

Output (lyrics):
```
**Verse 1**  
In the stillness of the early morn,  
A giant rose against the dawn...

**Chorus**  
We're reaching for beyond the blue,  
A multi-planet dream come true...
```