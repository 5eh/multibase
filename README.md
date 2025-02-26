# Multibase

Multibase is an innovative project that transforms blockchain activity into music, allowing you to "listen" to the blockchain in a fun and unique way.


<3

## How It Works

1. **Blockchain Data Collection**: Multibase retrieves the history of the blockchain and counts transactions in each block.

2. **Block Aggregation**: Blocks are grouped into sets (e.g., 1000 blocks), and transaction counts are aggregated.

3. **Music Generation**: The aggregated transaction data influences musical parameters:
   - Higher transaction counts create higher BPM (beats per minute) songs
   - Lower transaction counts create lower BPM songs
   - Each song's characteristics reflect the blockchain activity

## Features

- Real-time translation of blockchain activity into musical elements
- Dynamic song generation based on transaction volumes
- Audio visualization of blockchain data

## How to run

1. cd multibase && cd indexer
2. npx squid-graphql-server
3. CTRL SHFT ` && cd frontend
4. pnpm install && pnpm dev
5. open localhost:4350
6. open localhost:3000
7. enjoy the music

^^ Revised:
1. docker compose up -d
2. npm run build
3. npx squid-typeorm-migration apply
4. node -r dotenv/config lib/main.js
5. npx squid-graphql-server


## Getting Started

*Coming soon: Installation instructions and usage examples*

## License

See the [LICENSE](LICENSE) file for details.
