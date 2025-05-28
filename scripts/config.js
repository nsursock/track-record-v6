// Configuration for Apple Music Affiliate Link Generator

module.exports = {
    // Apple Music Affiliate Configuration
    affiliate: {
        // Your Apple Music affiliate token (get from https://affiliate.itunes.apple.com/)
        token: process.env.APPLE_MUSIC_AFFILIATE_TOKEN || '1010lMoe',
        
        // Your Apple Developer Team ID (for API access)
        teamId: process.env.APPLE_MUSIC_TEAM_ID || 'YOUR_TEAM_ID',
        
        // Demo token for testing
        demoToken: 'DEMO_TOKEN'
    },

    // Apple Music API Configuration
    api: {
        baseUrl: 'https://api.music.apple.com/v1',
        country: 'us', // Country code for Apple Music catalog
        searchLimit: 1, // Number of search results to fetch
        rateLimitDelay: 100 // Delay between API calls (ms)
    },

    // Apple Music URLs
    urls: {
        base: 'https://music.apple.com',
        search: 'https://music.apple.com/search'
    },

    // Song mention regex pattern
    songPattern: /\[SONG:\s*"([^"]+)"\s*\|\s*ARTIST:\s*"([^"]+)"\s*\|\s*GENRE:\s*"([^"]+)"\]/g,

    // Output formatting
    output: {
        linkText: '🎵 Listen on Apple Music',
        linkFormat: '[{linkText}]({url})',
        enhancedFormat: '{originalMention} {link}'
    },

    // File naming
    files: {
        defaultSuffix: '_enhanced',
        backupOriginal: false
    }
}; 