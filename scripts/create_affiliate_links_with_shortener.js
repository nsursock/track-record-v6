const fs = require('fs');
const https = require('https');

// Configuration
const AFFILIATE_TOKEN = process.env.APPLE_MUSIC_AFFILIATE_TOKEN || '1010lMoe';
const USE_SHORT_LINKS = process.env.USE_SHORT_LINKS !== 'false'; // Default to true
const SHORTENER_SERVICE = process.env.SHORTENER_SERVICE || 'tinyurl'; // tinyurl, bitly, custom

class iTunesAffiliateLinkGeneratorWithShortener {
    constructor(affiliateToken = AFFILIATE_TOKEN) {
        this.affiliateToken = affiliateToken;
        this.baseUrl = 'https://itunes.apple.com/search';
        this.useShortLinks = USE_SHORT_LINKS;
        this.shortenerService = SHORTENER_SERVICE;
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

    // Shorten URL using TinyURL (free, no API key needed)
    async shortenWithTinyURL(longUrl) {
        return new Promise((resolve, reject) => {
            const encodedUrl = encodeURIComponent(longUrl);
            const tinyUrlApi = `https://tinyurl.com/api-create.php?url=${encodedUrl}`;

            https.get(tinyUrlApi, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    if (data.startsWith('https://tinyurl.com/')) {
                        resolve(data.trim());
                    } else {
                        reject(new Error('TinyURL API error: ' + data));
                    }
                });
            }).on('error', (error) => {
                reject(error);
            });
        });
    }

    // Shorten URL using Bit.ly (requires API key)
    async shortenWithBitly(longUrl) {
        const BITLY_TOKEN = process.env.BITLY_ACCESS_TOKEN;
        
        if (!BITLY_TOKEN) {
            throw new Error('BITLY_ACCESS_TOKEN environment variable required for Bit.ly');
        }

        return new Promise((resolve, reject) => {
            const postData = JSON.stringify({
                long_url: longUrl,
                domain: "bit.ly"
            });

            const options = {
                hostname: 'api-ssl.bitly.com',
                port: 443,
                path: '/v4/shorten',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${BITLY_TOKEN}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
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
                        if (response.link) {
                            resolve(response.link);
                        } else {
                            reject(new Error('Bit.ly API error: ' + data));
                        }
                    } catch (error) {
                        reject(error);
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

    // Generic URL shortener
    async shortenUrl(longUrl) {
        if (!this.useShortLinks) {
            return longUrl;
        }

        // Warning: URL shortening can sometimes break affiliate tracking
        console.warn('⚠️  WARNING: URL shortening may interfere with affiliate tracking.');
        console.warn('   Consider setting USE_SHORT_LINKS=false for better tracking accuracy.');

        try {
            switch (this.shortenerService.toLowerCase()) {
                case 'tinyurl':
                    return await this.shortenWithTinyURL(longUrl);
                case 'bitly':
                    return await this.shortenWithBitly(longUrl);
                case 'custom':
                    // Implement your custom shortener here
                    return await this.shortenWithCustomService(longUrl);
                default:
                    console.warn(`Unknown shortener service: ${this.shortenerService}, using TinyURL`);
                    return await this.shortenWithTinyURL(longUrl);
            }
        } catch (error) {
            console.warn(`URL shortening failed: ${error.message}, using original URL`);
            return longUrl;
        }
    }

    // Placeholder for custom shortener service
    async shortenWithCustomService(longUrl) {
        // Example implementation for your own service
        // Replace with your actual API endpoint
        throw new Error('Custom shortener not implemented. Set SHORTENER_SERVICE to "tinyurl" or "bitly"');
    }

    // Search iTunes for a song and get affiliate link
    async getAffiliateLink(songTitle, artistName) {
        return new Promise((resolve, reject) => {
            const query = new URLSearchParams({
                term: `${songTitle} ${artistName}`,
                media: 'music',
                limit: 1,
                country: 'US' // Add country parameter for better results
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
                            
                            // Use Apple Music URL without region for auto-detection
                            let appleMusicUrl;
                            if (track.trackViewUrl) {
                                // Extract album and track IDs from the original URL
                                const url = new URL(track.trackViewUrl);
                                const pathParts = url.pathname.split('/');
                                const albumId = pathParts[pathParts.length - 1];
                                const trackId = track.trackId;
                                
                                // Create Apple Music URL without region for auto-detection
                                appleMusicUrl = `https://music.apple.com/album/${albumId}?i=${trackId}&at=${this.affiliateToken}&ct=blog&ls=1&app=music`;
                            } else {
                                // Fallback to search link if no trackViewUrl (no region for auto-detection)
                                const searchQuery = encodeURIComponent(`${songTitle} ${artistName}`);
                                appleMusicUrl = `https://music.apple.com/search?term=${searchQuery}&at=${this.affiliateToken}&ct=blog&ls=1&app=music`;
                            }
                            
                            resolve({
                                found: true,
                                link: appleMusicUrl,
                                trackName: track.trackName,
                                artistName: track.artistName,
                                albumName: track.collectionName,
                                trackId: track.trackId
                            });
                        } else {
                            // Fallback to search link if no direct match (no region for auto-detection)
                            const searchQuery = encodeURIComponent(`${songTitle} ${artistName}`);
                            const fallbackLink = `https://music.apple.com/search?term=${searchQuery}&at=${this.affiliateToken}&ct=blog&ls=1&app=music`;
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
            console.log(`Short links: ${this.useShortLinks ? 'enabled' : 'disabled'}`);
            if (this.useShortLinks) {
                console.log(`Shortener service: ${this.shortenerService}`);
            }
            
            const content = fs.readFileSync(inputFilePath, 'utf8');
            const songs = this.extractSongMentions(content);
            
            console.log(`Found ${songs.length} song mentions`);

            let processedContent = content;
            let offset = 0;
            let directLinks = 0;
            let searchLinks = 0;
            let shortenedLinks = 0;

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

                    // Shorten the URL if enabled
                    let finalLink = result.link;
                    if (this.useShortLinks) {
                        console.log(`🔗 Shortening URL...`);
                        finalLink = await this.shortenUrl(result.link);
                        if (finalLink !== result.link) {
                            shortenedLinks++;
                            console.log(`✓ Shortened: ${finalLink}`);
                        }
                    }

                    // Create the enhanced song mention with affiliate link
                    const enhancedMention = `${song.fullMatch} [🎵 Listen on Apple Music](${finalLink})`;

                    // Replace in content
                    const originalIndex = song.index + offset;
                    const beforeReplacement = processedContent.substring(0, originalIndex);
                    const afterReplacement = processedContent.substring(originalIndex + song.fullMatch.length);
                    
                    processedContent = beforeReplacement + enhancedMention + afterReplacement;
                    
                    // Update offset for next replacements
                    offset += enhancedMention.length - song.fullMatch.length;

                    // Add delay to be respectful to APIs
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
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
                shortenedLinks,
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
        console.log('Usage: node create_affiliate_links_with_shortener.js <input-file> [output-file]');
        console.log('');
        console.log('Environment variables:');
        console.log('  APPLE_MUSIC_AFFILIATE_TOKEN - Your Apple affiliate token (optional)');
        console.log('  USE_SHORT_LINKS - Set to "false" to disable URL shortening (default: true)');
        console.log('  SHORTENER_SERVICE - "tinyurl" (free) or "bitly" (requires token) (default: tinyurl)');
        console.log('  BITLY_ACCESS_TOKEN - Required if using Bit.ly service');
        console.log('');
        console.log('Examples:');
        console.log('  node create_affiliate_links_with_shortener.js plan_test.md');
        console.log('  USE_SHORT_LINKS=false node create_affiliate_links_with_shortener.js plan_test.md');
        console.log('  SHORTENER_SERVICE=bitly node create_affiliate_links_with_shortener.js plan_test.md');
        console.log('');
        console.log('⚠️  NOTE: URL shortening may interfere with affiliate tracking.');
        console.log('   For better tracking accuracy, consider using: USE_SHORT_LINKS=false');
        process.exit(1);
    }

    const inputFile = args[0];
    const outputFile = args[1] || inputFile.replace(/\.md$/, '_enhanced.md');

    if (!fs.existsSync(inputFile)) {
        console.error(`Error: Input file "${inputFile}" does not exist.`);
        process.exit(1);
    }

    const generator = new iTunesAffiliateLinkGeneratorWithShortener();
    
    try {
        const result = await generator.processMarkdownFile(inputFile, outputFile);
        console.log(`\n🎉 Success! Processed ${result.songsProcessed} songs.`);
        console.log(`📍 Direct links: ${result.directLinks}`);
        console.log(`🔍 Search links: ${result.searchLinks}`);
        if (USE_SHORT_LINKS) {
            console.log(`🔗 Shortened links: ${result.shortenedLinks}`);
        }
        console.log(`Enhanced file: ${result.outputFile}`);
    } catch (error) {
        console.error(`\n❌ Error: ${error.message}`);
        process.exit(1);
    }
}

// Export for use as module
module.exports = iTunesAffiliateLinkGeneratorWithShortener;

// Run if called directly
if (require.main === module) {
    main();
}