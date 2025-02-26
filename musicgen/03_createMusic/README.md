# Music Generation Tool

A command-line tool that generates music using the APIBox.ai API. This tool creates instrumental music tracks based on text prompts and downloads the resulting MP3 files.

## Features

- Generate instrumental music from text descriptions
- Specify music style and title
- Track generation progress with a live status display
- Download multiple variations of the generated music
- Resume checking on previously created tasks

## Prerequisites

- [Deno](https://deno.com/) runtime installed
- APIBox API key (set as environment variable)

## Installation

No installation required. Just run the script with Deno.

Set your API key as an environment variable:

```bash
export APIBOX_API_KEY="your_api_key_here"
```

## Usage

Basic usage:

```bash
deno run -A index.js
```

This will generate a calm piano track by default.

### Command Line Options

| Option | Description |
|--------|-------------|
| `-p, --prompt` | Music description (default: "A calm and relaxing piano track with soft melodies") |
| `-s, --style` | Music style (default: "Classical") |
| `-t, --title` | Music title (default: "Peaceful Piano Meditation") |
| `-m, --model` | Model version: V3_5 or V4 (default: V3_5) |
| `-i, --task-id` | Use existing task ID instead of creating new |
| `-h, --help` | Show help message |

### Examples

Generate epic battle music:
```bash
deno run -A index.js --prompt="Epic orchestral battle music with drums and brass" --style="Cinematic" --title="Battle of the Ages"
```

Generate electronic dance music:
```bash
deno run -A index.js -p "Upbeat electronic dance music with a strong beat" -s "EDM" -t "Dance Floor Energy"
```

Check status of a previous task:
```bash
deno run -A index.js --task-id=a4bc93b000b68ac221efea9e087042b9
```

## How It Works

1. The script sends a request to the APIBox.ai API with your prompt, style, and title
2. It receives a task ID and begins polling for completion
3. The generation process goes through several stages: PENDING → TEXT_SUCCESS → FIRST_SUCCESS → SUCCESS
4. When complete, the script downloads the generated MP3 files
5. Multiple variations of your request are typically generated

## Troubleshooting

- If generation times out, you can resume by using the task ID (saved in last_task_id.txt)
- Make sure your API key is correctly set as an environment variable
- Check your internet connection if downloads fail

## License

MIT
