const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const APPLE_MUSIC_AFFILIATE_TOKEN = process.env.APPLE_MUSIC_AFFILIATE_TOKEN || 'YOUR_AFFILIATE_TOKEN';
const APPLE_MUSIC_TEAM_ID = process.env.APPLE_MUSIC_TEAM_ID || 'YOUR_TEAM_ID';

class AppleMusicAffiliateLinkGenerator {
    constructor() {
        this.baseUrl = 'https://api.music.apple.com/v1';
        this.affiliateUrl = 'https://music.apple.com';
    }

    // Extract song mentions from markdown content
    extractSongMentions(content) {
        const songRegex = /\[SONG:\s*"([^"]+)"\s*\|\s*ARTIST:\s*"([^"]+)"\s*\|\s*GENRE:\s*"([^"]+)"\]/g;
        const songs = [];
        let match;

        while ((match = songRegex.exec(content)) !== null) {
            songs.push({
                fullMatch: match[0],
                title: match[1],
                artist: match[2],
                genre: match[3],
                index: match.index
            });
        }

        return songs;
    }

    // Search Apple Music for a song
    async searchAppleMusic(songTitle, artistName) {
        return new Promise((resolve, reject) => {
            const query = encodeURIComponent(`${songTitle} ${artistName}`);
            const url = `${this.baseUrl}/catalog/us/search?term=${query}&types=songs&limit=1`;

            const options = {
                hostname: 'api.music.apple.com',
                path: `/v1/catalog/us/search?term=${query}&types=songs&limit=1`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${APPLE_MUSIC_TEAM_ID}`,
                    'User-Agent': 'Mozilla/5.0 (compatible; affiliate-link-generator/1.0)'
                }
            };

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (response.results && response.results.songs && response.results.songs.data.length > 0) {
                            const song = response.results.songs.data[0];
                            resolve({
                                id: song.id,
                                url: song.attributes.url,
                                title: song.attributes.name,
                                artist: song.attributes.artistName,
                                album: song.attributes.albumName
                            });
                        } else {
                            resolve(null);
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.end();
        });
    }

    // Create affiliate link
    createAffiliateLink(appleMusicUrl, songTitle, artistName) {
        if (!appleMusicUrl) {
            // Fallback: create a search link
            const searchQuery = encodeURIComponent(`${songTitle} ${artistName}`);
            return `${this.affiliateUrl}/search?term=${searchQuery}&at=${APPLE_MUSIC_AFFILIATE_TOKEN}`;
        }

        // Add affiliate token to existing URL
        const separator = appleMusicUrl.includes('?') ? '&' : '?';
        return `${appleMusicUrl}${separator}at=${APPLE_MUSIC_AFFILIATE_TOKEN}`;
    }

    // Process markdown file and add affiliate links
    async processMarkdownFile(inputFilePath, outputFilePath) {
        try {
            console.log(`Processing file: ${inputFilePath}`);
            
            const content = fs.readFileSync(inputFilePath, 'utf8');
            const songs = this.extractSongMentions(content);
            
            console.log(`Found ${songs.length} song mentions`);

            let processedContent = content;
            let offset = 0;

            for (const song of songs) {
                console.log(`Searching for: "${song.title}" by ${song.artist}`);
                
                try {
                    // Search Apple Music (with fallback for demo purposes)
                    let appleMusicData = null;
                    try {
                        appleMusicData = await this.searchAppleMusic(song.title, song.artist);
                    } catch (error) {
                        console.warn(`Apple Music API error for "${song.title}": ${error.message}`);
                    }

                    // Create affiliate link
                    const affiliateLink = this.createAffiliateLink(
                        appleMusicData?.url,
                        song.title,
                        song.artist
                    );

                    // Create the enhanced song mention with affiliate link
                    const enhancedMention = `${song.fullMatch} [🎵 Listen on Apple Music](${affiliateLink})`;

                    // Replace in content
                    const originalIndex = song.index + offset;
                    const beforeReplacement = processedContent.substring(0, originalIndex);
                    const afterReplacement = processedContent.substring(originalIndex + song.fullMatch.length);
                    
                    processedContent = beforeReplacement + enhancedMention + afterReplacement;
                    
                    // Update offset for next replacements
                    offset += enhancedMention.length - song.fullMatch.length;

                    console.log(`✓ Added affiliate link for "${song.title}"`);
                    
                    // Add delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                } catch (error) {
                    console.error(`Error processing "${song.title}": ${error.message}`);
                    // Continue with next song
                }
            }

            // Write the processed content to output file
            fs.writeFileSync(outputFilePath, processedContent, 'utf8');
            console.log(`✓ Enhanced markdown saved to: ${outputFilePath}`);
            
            return {
                songsProcessed: songs.length,
                outputFile: outputFilePath
            };

        } catch (error) {
            console.error(`Error processing file: ${error.message}`);
            throw error;
        }
    }
}

// CLI usage
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
        console.log('Usage: node create_affiliate_links.js <input-file> [output-file]');
        console.log('');
        console.log('Environment variables:');
        console.log('  APPLE_MUSIC_AFFILIATE_TOKEN - Your Apple Music affiliate token');
        console.log('  APPLE_MUSIC_TEAM_ID - Your Apple Music team ID for API access');
        console.log('');
        console.log('Example:');
        console.log('  node create_affiliate_links.js plan_test.md plan_test_enhanced.md');
        process.exit(1);
    }

    const inputFile = args[0];
    const outputFile = args[1] || inputFile.replace(/\.md$/, '_enhanced.md');

    if (!fs.existsSync(inputFile)) {
        console.error(`Error: Input file "${inputFile}" does not exist.`);
        process.exit(1);
    }

    const generator = new AppleMusicAffiliateLinkGenerator();
    
    try {
        const result = await generator.processMarkdownFile(inputFile, outputFile);
        console.log(`\n🎉 Success! Processed ${result.songsProcessed} songs.`);
        console.log(`Enhanced file: ${result.outputFile}`);
    } catch (error) {
        console.error(`\n❌ Error: ${error.message}`);
        process.exit(1);
    }
}

// Export for use as module
module.exports = AppleMusicAffiliateLinkGenerator;

// Run if called directly
if (require.main === module) {
    main();
}
