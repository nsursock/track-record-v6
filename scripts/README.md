# Apple Music Affiliate Link Generator

This script automatically finds song mentions in markdown files and adds Apple Music affiliate links next to them. It's designed to work with the specific song format used in your blog post plans.

## Song Format

The script looks for songs in this format:
```
[SONG: "Song Title" | ARTIST: "Artist Name" | GENRE: "genre"]
```

And converts them to:
```
[SONG: "Song Title" | ARTIST: "Artist Name" | GENRE: "genre"] [🎵 Listen on Apple Music](affiliate-link)
```

## Files

- `create_affiliate_links_free.js` - **RECOMMENDED** - Uses free iTunes Search API for direct links
- `create_affiliate_links.js` - Full version with Apple Music API integration (requires developer account)
- `create_affiliate_links_demo.js` - Demo version that creates search links only
- `package.json` - Node.js dependencies

## Quick Start (Free Version - RECOMMENDED)

The free version uses iTunes Search API and works immediately without any setup:

```bash
cd scripts
node create_affiliate_links_free.js ../plan_test.md
```

This will create `plan_test_enhanced.md` with **direct song links**!

### Demo Version (Search Links Only)

For testing with search links only:

```bash
cd scripts
node create_affiliate_links_demo.js ../plan_test.md
```

## Full Version Setup

For the full version with direct song links, you need Apple Music API credentials:

### 1. Get Apple Music Credentials

1. **Affiliate Token**: Sign up for the [Apple Affiliate Program](https://affiliate.itunes.apple.com/)
2. **Team ID**: Get your Apple Developer Team ID from [Apple Developer Portal](https://developer.apple.com/)

### 2. Set Environment Variables

```bash
export APPLE_MUSIC_AFFILIATE_TOKEN="your_affiliate_token"
export APPLE_MUSIC_TEAM_ID="your_team_id"
```

### 3. Run the Script

```bash
cd scripts
node create_affiliate_links.js ../plan_test.md
```

## Usage Examples

### Basic usage:
```bash
node create_affiliate_links_demo.js input.md
# Creates input_enhanced.md
```

### Specify output file:
```bash
node create_affiliate_links_demo.js input.md output.md
```

### Using npm scripts:
```bash
npm run demo plan_test.md
npm run test  # Processes plan_test.md
```

## How It Works

1. **Extracts Songs**: Uses regex to find all song mentions in the markdown
2. **Searches Apple Music**: (Full version) Queries Apple Music API for each song
3. **Creates Links**: Generates affiliate links for each song
4. **Enhances Markdown**: Adds clickable links next to each song mention
5. **Preserves Format**: Keeps original song format intact, just adds links

## Output Example

**Before:**
```markdown
**Proposed Song to Illustrate (Intro):**
[SONG: "Ball and Chain" | ARTIST: "Janis Joplin" | GENRE: "blues"] — Raw emotional exposure
```

**After:**
```markdown
**Proposed Song to Illustrate (Intro):**
[SONG: "Ball and Chain" | ARTIST: "Janis Joplin" | GENRE: "blues"] [🎵 Listen on Apple Music](https://music.apple.com/search?term=Ball%20and%20Chain%20Janis%20Joplin&at=DEMO_TOKEN) — Raw emotional exposure
```

## Features

- ✅ Preserves original markdown formatting
- ✅ Handles multiple songs per file
- ✅ Creates fallback search links if song not found
- ✅ Rate limiting to avoid API issues
- ✅ Error handling for individual songs
- ✅ Works with or without API credentials

## AI Integration

The enhanced markdown files are perfect for AI blog post generation because:

- Links are placed naturally next to song mentions
- Original formatting is preserved
- AI can easily include the links in the final blog post
- Links are clearly marked with 🎵 emoji for easy identification

## Troubleshooting

### "File not found" error
Make sure the input file path is correct relative to the scripts directory.

### API errors (full version)
- Check your Apple Music credentials
- Ensure you have proper API access
- The script will fall back to search links if API fails

### No songs found
Verify your markdown uses the exact format: `[SONG: "Title" | ARTIST: "Artist" | GENRE: "genre"]`

## Requirements

- Node.js 14.0.0 or higher
- No external dependencies (uses built-in Node.js modules) 