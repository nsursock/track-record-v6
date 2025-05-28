const fs = require('fs');
const https = require('https');

// Configuration
const AFFILIATE_TOKEN = process.env.APPLE_MUSIC_AFFILIATE_TOKEN || '1010lMoe';
const CAMPAIGN_NAME = process.env.CAMPAIGN_NAME || 'blog-post';

class AppleOfficialLinkGenerator {
    constructor(affiliateToken = AFFILIATE_TOKEN, campaignName = CAMPAIGN_NAME) {
        this.affiliateToken = affiliateToken;
        this.campaignName = campaignName;
        this.baseUrl = 'https://itunes.apple.com/search';
        this.linkBuilderUrl = 'https://toolbox.marketingtools.apple.com';
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

    // Search iTunes for a song and get the track URL
    async getTrackUrl(songTitle, artistName) {
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
                            resolve({
                                found: true,
                                trackViewUrl: track.trackViewUrl,
                                trackName: track.trackName,
                                artistName: track.artistName,
                                albumName: track.collectionName
                            });
                        } else {
                            resolve({
                                found: false,
                                trackViewUrl: null,
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

    // Attempt to generate Apple.co short link using Apple's Link Builder API
    async generateAppleShortLink(trackUrl) {
        // This is a simplified approach - the actual API might be more complex
        // We'll try to reverse-engineer the API call that the webpage makes
        
        return new Promise((resolve, reject) => {
            // Construct the API payload (this is an educated guess based on the form fields)
            const postData = JSON.stringify({
                url: trackUrl,
                affiliateToken: this.affiliateToken,
                campaignName: this.campaignName
            });

            // Try the most likely API endpoint
            const options = {
                hostname: 'toolbox.marketingtools.apple.com',
                port: 443,
                path: '/api/v1/short-link', // This is a guess - might need adjustment
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData),
                    'User-Agent': 'Mozilla/5.0 (compatible; affiliate-link-generator/1.0)',
                    'Referer': 'https://toolbox.marketingtools.apple.com/en-us/apple-music/link-builder'
                }
            };

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        if (res.statusCode === 200) {
                            const response = JSON.parse(data);
                            if (response.shortUrl || response.shortLink) {
                                resolve(response.shortUrl || response.shortLink);
                            } else {
                                reject(new Error('No short link in response'));
                            }
                        } else {
                            reject(new Error(`API returned status ${res.statusCode}: ${data}`));
                        }
                    } catch (error) {
                        reject(new Error(`Failed to parse response: ${error.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.write(postData);
            req.end();
        });
    }

    // Fallback: Create manual affiliate link
    createManualAffiliateLink(trackUrl) {
        if (!trackUrl) {
            return null;
        }
        
        const separator = trackUrl.includes('?') ? '&' : '?';
        return `${trackUrl}${separator}at=${this.affiliateToken}`;
    }

    // Process a single song
    async processSong(songTitle, artistName) {
        console.log(`Searching iTunes for: "${songTitle}" by ${artistName}`);
        
        try {
            // First, get the iTunes track URL
            const trackInfo = await this.getTrackUrl(songTitle, artistName);
            
            if (!trackInfo.found) {
                console.log(`⚠ No exact match found for "${songTitle}"`);
                // Create search link as fallback
                const searchQuery = encodeURIComponent(`${songTitle} ${artistName}`);
                const fallbackLink = `https://music.apple.com/search?term=${searchQuery}&at=${this.affiliateToken}`;
                return {
                    success: false,
                    link: fallbackLink,
                    type: 'search'
                };
            }

            console.log(`✓ Found: ${trackInfo.trackName} by ${trackInfo.artistName}`);

            // Try to generate official Apple short link
            try {
                console.log(`🔗 Attempting to generate Apple.co short link...`);
                const shortLink = await this.generateAppleShortLink(trackInfo.trackViewUrl);
                console.log(`✓ Generated Apple.co link: ${shortLink}`);
                return {
                    success: true,
                    link: shortLink,
                    type: 'apple-short'
                };
            } catch (error) {
                console.log(`⚠ Apple Link Builder API failed: ${error.message}`);
                console.log(`📍 Using manual affiliate link instead`);
                
                // Fallback to manual affiliate link
                const manualLink = this.createManualAffiliateLink(trackInfo.trackViewUrl);
                return {
                    success: true,
                    link: manualLink,
                    type: 'manual-affiliate'
                };
            }

        } catch (error) {
            console.error(`Error processing "${songTitle}": ${error.message}`);
            return {
                success: false,
                link: null,
                type: 'error'
            };
        }
    }

    // Process markdown file and add affiliate links
    async processMarkdownFile(inputFilePath, outputFilePath) {
        try {
            console.log(`Processing file: ${inputFilePath}`);
            console.log(`Affiliate token: ${this.affiliateToken}`);
            console.log(`Campaign name: ${this.campaignName}`);
            
            const content = fs.readFileSync(inputFilePath, 'utf8');
            const songs = this.extractSongMentions(content);
            
            console.log(`Found ${songs.length} song mentions`);

            let processedContent = content;
            let offset = 0;
            let stats = {
                appleShort: 0,
                manualAffiliate: 0,
                searchLinks: 0,
                errors: 0
            };

            for (const song of songs) {
                const result = await this.processSong(song.title, song.artist);
                
                if (result.link) {
                    // Update stats
                    switch (result.type) {
                        case 'apple-short':
                            stats.appleShort++;
                            break;
                        case 'manual-affiliate':
                            stats.manualAffiliate++;
                            break;
                        case 'search':
                            stats.searchLinks++;
                            break;
                        default:
                            stats.errors++;
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
                } else {
                    stats.errors++;
                }

                // Add delay to be respectful to APIs
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // Write the processed content to output file
            fs.writeFileSync(outputFilePath, processedContent, 'utf8');
            console.log(`✓ Enhanced markdown saved to: ${outputFilePath}`);
            
            return {
                songsProcessed: songs.length,
                stats,
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
        console.log('Usage: node create_affiliate_links_official_apple.js <input-file> [output-file]');
        console.log('');
        console.log('Environment variables:');
        console.log('  APPLE_MUSIC_AFFILIATE_TOKEN - Your Apple affiliate token (required)');
        console.log('  CAMPAIGN_NAME - Campaign name for tracking (optional, default: "blog-post")');
        console.log('');
        console.log('This script attempts to use Apple\'s official Link Builder API to generate');
        console.log('real apple.co short links. If that fails, it falls back to manual affiliate links.');
        console.log('');
        console.log('Examples:');
        console.log('  node create_affiliate_links_official_apple.js plan_test.md');
        console.log('  CAMPAIGN_NAME=newsletter node create_affiliate_links_official_apple.js plan_test.md');
        process.exit(1);
    }

    const inputFile = args[0];
    const outputFile = args[1] || inputFile.replace(/\.md$/, '_enhanced.md');

    if (!fs.existsSync(inputFile)) {
        console.error(`Error: Input file "${inputFile}" does not exist.`);
        process.exit(1);
    }

    const generator = new AppleOfficialLinkGenerator();
    
    try {
        const result = await generator.processMarkdownFile(inputFile, outputFile);
        console.log(`\n🎉 Success! Processed ${result.songsProcessed} songs.`);
        console.log(`🍎 Apple.co short links: ${result.stats.appleShort}`);
        console.log(`📍 Manual affiliate links: ${result.stats.manualAffiliate}`);
        console.log(`🔍 Search links: ${result.stats.searchLinks}`);
        console.log(`❌ Errors: ${result.stats.errors}`);
        console.log(`Enhanced file: ${result.outputFile}`);
        
        if (result.stats.appleShort === 0) {
            console.log(`\n💡 Note: Apple Link Builder API access may require authentication.`);
            console.log(`The script fell back to manual affiliate links, which still work great!`);
        }
    } catch (error) {
        console.error(`\n❌ Error: ${error.message}`);
        process.exit(1);
    }
}

// Export for use as module
module.exports = AppleOfficialLinkGenerator;

// Run if called directly
if (require.main === module) {
    main();
} 