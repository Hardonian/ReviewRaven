# ReviewGhost
**“Ghost the fake reviews before you buy.”**

ReviewGhost is a consumer-protection tool designed to identify suspicious patterns in product reviews. It helps users avoid products with manipulated feedback by providing a simple, deterministic verdict.

## How It Works
1. **URL Input**: Paste a product link from supported platforms (Amazon, Walmart, etc.).
2. **Signal Analysis**: Our engine scans for linguistic anomalies, temporal spikes in review frequency, and reviewer account health.
3. **Verdict**: Returns a clear recommendation: **BUY**, **CAUTION**, **AVOID**, or **UNKNOWN**.

## Limitations
- **Patterns, Not Truth**: We identify *suspicious patterns* and *low trust signals*. We do not claim reviews are "fake" in a legal sense.
- **Scraping**: Analysis depends on data availability. Some sites may block analysis or return partial results.
- **New Products**: Products with very few reviews may return **UNKNOWN**.

## Setup Instructions
1. Clone the repository: `git clone https://github.com/Hardonian/ReviewGhost.git`
2. Install dependencies: `npm install`
3. Configure environment variables: Copy `.env.example` to `.env` and add your scraping keys.
4. Run locally: `npm run dev`

## Verification Commands
- `npm run lint`: Check for code style consistency.
- `npm run test`: Run the signal analysis test suite.
- `npm run build`: Verify the production bundle.
