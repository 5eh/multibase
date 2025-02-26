# 🎵 Music Generation Tool

A colorful command-line tool that generates instrumental music tracks using the APIBox.ai API based on text descriptions.

## ✨ Features

- Generate instrumental music from text descriptions
- Specify music style and title
- Live status display with progress animation
- Download multiple variations of your generated music
- Resume checking on previously created tasks

## 🔧 Prerequisites

- [Deno](https://deno.com/) runtime installed
- APIBox API key (set as environment variable)

## 🚀 Getting Started

Set your API key as an environment variable:

```bash
export APIBOX_API_KEY="your_api_key_here"
```

## 📋 Usage

Basic usage:

```bash
deno run -A musicgen/03_createMusic/index.js
```

This will generate a calm piano track by default.

### Command Line Options

| Option | Description |
|--------|-------------|
| `-p, --prompt` | Music description |
| `-s, --style` | Music style |
| `-t, --title` | Music title |
| `-m, --model` | Model version (V3_5 or V4) |
| `-i, --task-id` | Use existing task ID |
| `-h, --help` | Show help message |

### Examples

Generate epic battle music:
```bash
deno run -A musicgen/03_createMusic/index.js -p "Epic orchestral battle music with drums and brass" -s "Cinematic" -t "Battle of the Ages"
```

Generate electronic dance music:
```bash
deno run -A musicgen/03_createMusic/index.js -p "Upbeat electronic dance music with a strong beat" -s "EDM" -t "Dance Floor Energy"
```

Check status of a previous task:
```bash
deno run -A musicgen/03_createMusic/index.js -i a4bc93b000b68ac221efea9e087042b9
```

## ⚙️ How It Works

1. The script sends a request to the APIBox.ai API with your prompt, style, and title
2. It receives a task ID and begins polling for completion status
3. The generation process goes through several stages:
   - **Initializing**: Setting up the generation task
   - **Creating music**: Composing the musical structure
   - **Finalizing**: Refining and preparing the tracks
   - **Complete**: Music is ready for download
4. When complete, the script downloads the generated MP3 files (usually 2 variations)
5. Files are saved with the title name in the current directory

## 📝 Example Output

```
Creating music generation task:
• Prompt: A calm and relaxing piano track with soft melodies
• Style: Classical
• Title: Peaceful Piano Meditation
• Model: V3_5
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
✅ Music saved to ./peaceful_piano_meditation_1.mp3
✅ Music saved to ./peaceful_piano_meditation_2.mp3

✨ Music generation complete!
```

## 🔍 Troubleshooting

- If generation times out, you can resume by using the task ID (saved in last_task_id.txt)
- Make sure your API key is correctly set as an environment variable
- Check your internet connection if downloads fail

## 📄 License

MIT
