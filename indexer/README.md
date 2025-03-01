# 📊 BlockBeats Indexer

A specialized [Squid](https://subsquid.io) project that serves as the foundation for the BlockBeats platform. It indexes [Kusama](https://kusama.network) blockchain transactions and serves them via GraphQL API, providing the critical data infrastructure for our music generation pipeline.

## ✨ Features

- Indexes Kusama network transactions and account transfers
- Provides real-time and historical blockchain data via GraphQL API
- Powers transaction analysis for music generation
- Enables time-series querying of blockchain activity
- Supports custom filtering and data aggregation
- Optimized for high-performance data retrieval
- Scalable architecture that can handle millions of transactions

## 🔧 Prerequisites

- Node.js 16.x or higher
- Docker
- npm (yarn is not supported)

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm i

# 2. Start the Postgres database
sqd up

# 3. Build the project
sqd build

# 4. Start both the processor and GraphQL server
sqd run .
```

The GraphQL playground will be available at [localhost:4350/graphql](http://localhost:4350/graphql).

## 📋 Integration with BlockBeats

This indexer is the first component in the BlockBeats pipeline:

1. **Indexer** (this component) - Captures and indexes blockchain transactions
2. **Transaction Analysis** - Analyzes transaction patterns and determines music styles
3. **News Fetcher** - Retrieves historical news about the blockchain
4. **Lyrics Generator** - Transforms insights into creative lyrics
5. **Music Creator** - Generates music based on the analysis and lyrics
6. **Thumbnail Generator** - Creates album cover art for the music

The indexer provides the raw blockchain data that drives our AI-powered music generation system, enabling BlockBeats to translate transaction patterns into unique musical compositions.

## 🔍 Available Data

The indexer provides access to:

- Transaction timestamps
- Sender and recipient addresses
- Transaction amounts
- Block information
- Account balances
- Historical time-series data

This data serves as the foundation for identifying patterns, trends, and rhythms in blockchain activity that are later transformed into musical elements.

## 🔄 Development Flow

### 1. Define Database Schema

The database schema is defined in `schema.graphql`, using GraphQL type declarations with custom directives.

### 2. Generate TypeORM Classes

```bash
sqd codegen
```

### 3. Generate Database Migrations

```bash
sqd migration:generate
sqd migration:apply
```

### 4. Generate TypeScript Type Definitions

```bash
sqd typegen
```

## 📦 Deployment

To deploy the indexer to Subsquid Cloud:

```bash
npx sqd auth -k YOUR_DEPLOYMENT_KEY
npx sqd squid deploy
```

## 📄 License

This project is licensed under the terms specified in the LICENSE file.