# 🎵 Kusama Music Generator

A colorful command-line tool that generates music tracks (with or without
lyrics) using the APIBox.ai API based on Kusama blockchain data. This module
serves as the fourth step in the MusicGen pipeline, transforming lyrics into
complete musical compositions.

## ✨ Features

- Generate music with lyrics or instrumental tracks
- Customize music style and BPM based on transaction volume
- Use Kusama-themed lyrics from the lyrics generator
- Live status display with progress animation
- Download multiple variations of your generated music
- Resume checking on previously created tasks
- Works both independently and as part of the MusicGen pipeline

## 🔧 Prerequisites

- [Deno](https://deno.com/) runtime installed
- APIBox.ai API key

## 🔑 Environment Setup

Set your API key as an environment variable:

```bash
export APIBOX_API_KEY="your_apibox_key_here"
```

## 📋 Usage

### Standalone Usage

Basic usage:

```bash
deno run -A index.js
```

This will generate a rock song about Kusama blockchain with default lyrics.

With specific month and year:

```bash
deno run -A index.js --prompt="Music about Kusama blockchain in January 2021" --title="Kusama January 2021"
```

### As Part of MusicGen Pipeline

This module is automatically called by the main pipeline script:

```bash
deno run -A ../../main.js --month="January" --year="2021"
```

## ⚙️ Parameters

| Option               | Description                                                   |
| -------------------- | ------------------------------------------------------------- |
| `-p, --prompt`       | Music description (default: "A song about Kusama blockchain") |
| `-s, --style`        | Music style (default: "Rock")                                 |
| `-t, --title`        | Music title (default: "Kusama Blockchain")                    |
| `-b, --bpm`          | Beats per minute (optional)                                   |
| `-m, --model`        | Model version (V3_5 or V4) (default: V3_5)                    |
| `-i, --task-id`      | Use existing task ID                                          |
| `-l, --lyrics`       | Custom lyrics (default: Kusama blockchain lyrics)             |
| `-n, --instrumental` | Generate instrumental music without lyrics                    |
| `-h, --help`         | Show help message                                             |

## 📤 Output

The module generates:

- MP3 audio files of the generated music (usually 2 variations)
- Files are saved with the title name in the current directory
- A task ID is saved to last_task_id.txt for resuming interrupted generations

## ⚙️ How It Works

1. The script sends a request to the APIBox.ai API with your prompt, style, and
   lyrics
2. It receives a task ID and begins polling for completion status
3. The generation process goes through several stages:
   - **Initializing**: Setting up the generation task
   - **Creating music**: Composing the musical structure
   - **Finalizing**: Refining and preparing the tracks
   - **Complete**: Music is ready for download
4. When complete, the script downloads the generated MP3 files (usually 2
   variations)
5. Files are saved with the title name in the current directory

## 🔄 Integration

This module is designed as part of the MusicGen pipeline:

1. **Transaction Analysis** - Analyzes blockchain data
2. **News Fetcher** - Retrieves historical news about Kusama blockchain
3. **Lyrics Generator** - Transforms content into creative lyrics
4. **Music Creator** (this module) - Generates music using the lyrics
5. **Thumbnail Generator** - Creates album cover art for the music

## 📝 Example Output

```
Creating music generation task:
• Prompt: Music about Kusama blockchain in January 2021
• Style: Dance
• Title: Kusama January 2021
• Model: V3_5
• Instrumental: No
• Lyrics: Custom lyrics included
  First few lines:
  (Verse 1)
  Digital canaries in the blockchain mine
  Testing grounds where innovations shine
  ...
• BPM: 128
✅ Task created successfully! Task ID: a4bc93b000b68ac221efea9e087042b9

Waiting for music generation to complete...
This typically takes 1-3 minutes.
⠋ Status: Initializing... (2/60)
...
⠙ Status: Creating music... (8/60)
...
⠹ Status: Finalizing... (15/60)
...
✅ Music generation complete!
Found 2 tracks
✅ Music saved to ./kusama_january_2021_1.mp3
✅ Music saved to ./kusama_january_2021_2.mp3

✨ Music generation complete!
```

## 🔍 Troubleshooting

- If generation times out, you can resume by using the task ID (saved in
  last_task_id.txt)
- Make sure your API key is correctly set as an environment variable
- Check your internet connection if downloads fail

## 📄 License

MIT
