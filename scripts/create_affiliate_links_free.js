const fs = require('fs');
const https = require('https');

// Configuration - only affiliate token needed
const AFFILIATE_TOKEN = process.env.APPLE_MUSIC_AFFILIATE_TOKEN || '1010lMoe';

class iTunesAffiliateLinkGenerator {
    constructor(affiliateToken = AFFILIATE_TOKEN) {
        this.affiliateToken = affiliateToken;
        this.baseUrl = 'https://itunes.apple.com/search';
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

    // Search iTunes for a song and get affiliate link
    async getAffiliateLink(songTitle, artistName) {
        return new Promise((resolve, reject) => {
            const query = new URLSearchParams({
                term: `${songTitle} ${artistName}`,
                media: 'music',
                limit: 1
            }).toString();

            const url = `${this.baseUrl}?${query}`;

            https.get(url, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        const results = response.results || [];
                        
                        if (results.length > 0) {
                            const track = results[0];
                            const affiliateLink = `${track.trackViewUrl}?at=${this.affiliateToken}`;
                            resolve({
                                found: true,
                                link: affiliateLink,
                                trackName: track.trackName,
                                artistName: track.artistName,
                                albumName: track.collectionName
                            });
                        } else {
                            // Fallback to search link if no direct match
                            const searchQuery = encodeURIComponent(`${songTitle} ${artistName}`);
                            const fallbackLink = `https://music.apple.com/search?term=${searchQuery}&at=${this.affiliateToken}`;
                            resolve({
                                found: false,
                                link: fallbackLink,
                                trackName: songTitle,
                                artistName: artistName
                            });
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            }).on('error', (error) => {
                reject(error);
            });
        });
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
            let directLinks = 0;
            let searchLinks = 0;

            for (const song of songs) {
                console.log(`Searching iTunes for: "${song.title}" by ${song.artist}`);
                
                try {
                    const result = await this.getAffiliateLink(song.title, song.artist);
                    
                    if (result.found) {
                        console.log(`✓ Found direct link: ${result.trackName} by ${result.artistName}`);
                        directLinks++;
                    } else {
                        console.log(`⚠ No exact match, using search link for "${song.title}"`);
                        searchLinks++;
                    }

                    // Create the enhanced song mention with affiliate link
                    const enhancedMention = `${song.fullMatch} [🎵 Listen on Apple Music](${result.link})`;

                    // Replace in content
                    const originalIndex = song.index + offset;
                    const beforeReplacement = processedContent.substring(0, originalIndex);
                    const afterReplacement = processedContent.substring(originalIndex + song.fullMatch.length);
                    
                    processedContent = beforeReplacement + enhancedMention + afterReplacement;
                    
                    // Update offset for next replacements
                    offset += enhancedMention.length - song.fullMatch.length;

                    // Add delay to be respectful to the API
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
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
                directLinks,
                searchLinks,
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
        console.log('Usage: node create_affiliate_links_free.js <input-file> [output-file]');
        console.log('');
        console.log('Environment variables:');
        console.log('  APPLE_MUSIC_AFFILIATE_TOKEN - Your Apple affiliate token (optional)');
        console.log('');
        console.log('This version uses the free iTunes Search API - no developer account needed!');
        console.log('');
        console.log('Example:');
        console.log('  node create_affiliate_links_free.js plan_test.md plan_test_enhanced.md');
        process.exit(1);
    }

    const inputFile = args[0];
    const outputFile = args[1] || inputFile.replace(/\.md$/, '_enhanced.md');

    if (!fs.existsSync(inputFile)) {
        console.error(`Error: Input file "${inputFile}" does not exist.`);
        process.exit(1);
    }

    const generator = new iTunesAffiliateLinkGenerator();
    
    try {
        const result = await generator.processMarkdownFile(inputFile, outputFile);
        console.log(`\n🎉 Success! Processed ${result.songsProcessed} songs.`);
        console.log(`📍 Direct links: ${result.directLinks}`);
        console.log(`🔍 Search links: ${result.searchLinks}`);
        console.log(`Enhanced file: ${result.outputFile}`);
        
        if (AFFILIATE_TOKEN === 'YOUR_AFFILIATE_TOKEN') {
            console.log(`\n💡 Tip: Set APPLE_MUSIC_AFFILIATE_TOKEN environment variable for real affiliate links.`);
        }
    } catch (error) {
        console.error(`\n❌ Error: ${error.message}`);
        process.exit(1);
    }
}

// Export for use as module
module.exports = iTunesAffiliateLinkGenerator;

// Run if called directly
if (require.main === module) {
    main();
} 