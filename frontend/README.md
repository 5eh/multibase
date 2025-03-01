# 🌐 BlockBeats Frontend

A Next.js-based modern web application for BlockBeats, providing an interactive user interface to explore blockchain-generated music and visualizations. This is the main frontend application being developed to replace FLAB.

## ✨ Features

- Modern reactive UI built with Next.js
- Server-side rendering for improved performance
- GraphQL integration for efficient data fetching
- Interactive music player and visualization components
- Responsive design that works across all devices
- Tailwind CSS for styling
- TypeScript for type safety

## 🔧 Prerequisites

- Node.js 16.x or higher
- pnpm package manager
- Local GraphQL endpoint (localhost:4350/graphql)

## 🚀 Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Make sure you have the GraphQL endpoint running
# The endpoint should be available at localhost:4350/graphql

# 3. Start the development server
pnpm run dev
```

Then visit:
- `http://localhost:3000/` for the main page
- `http://localhost:3000/test` for the test page

## 📋 Integration with BlockBeats

This frontend connects to the BlockBeats ecosystem components:

1. **Indexer** - Provides blockchain data via GraphQL
2. **Transaction Analysis** - Determines music styles
3. **Music Generator** - Creates the music tracks and visualizations

## 📄 License

This project is licensed under the terms specified in the LICENSE file.
