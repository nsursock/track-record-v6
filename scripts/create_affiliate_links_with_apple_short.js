const fs = require('fs');
const https = require('https');

// Configuration
const AFFILIATE_TOKEN = process.env.APPLE_MUSIC_AFFILIATE_TOKEN || '1010lMoe';
const USE_SHORT_LINKS = process.env.USE_SHORT_LINKS !== 'false'; // Default to true
const SHORTENER_SERVICE = process.env.SHORTENER_SERVICE || 'apple'; // apple, tinyurl, bitly

class iTunesAffiliateLinkGeneratorWithAppleShort {
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

    // Create Apple-style short link based on song title
    createAppleShortLink(songTitle, artistName) {
        // Apply Apple's documented rules for short links
        let shortName = songTitle.toLowerCase();
        
        // Remove whitespace
        shortName = shortName.replace(/\s+/g, '');
        
        // Remove copyright, trademark, registered symbols
        shortName = shortName.replace(/[©™®]/g, '');
        
        // Replace ampersands with "and"
        shortName = shortName.replace(/&/g, 'and');
        
        // Remove punctuation (Apple's documented set)
        shortName = shortName.replace(/[!¡"#$%'()*+,\-./:;<=>¿?@[\\\]^_`{|}~]/g, '');
        
        // Replace accented characters with basic equivalents
        shortName = shortName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        // Add affiliate token
        const appleShortUrl = `https://appstore.com/${shortName}?at=${this.affiliateToken}`;
        
        return appleShortUrl;
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

    // Generic URL shortener
    async shortenUrl(longUrl, songTitle, artistName) {
        if (!this.useShortLinks) {
            return longUrl;
        }

        try {
            switch (this.shortenerService.toLowerCase()) {
                case 'apple':
                    return this.createAppleShortLink(songTitle, artistName);
                case 'tinyurl':
                    return await this.shortenWithTinyURL(longUrl);
                default:
                    console.warn(`Unknown shortener service: ${this.shortenerService}, using Apple style`);
                    return this.createAppleShortLink(songTitle, artistName);
            }
        } catch (error) {
            console.warn(`URL shortening failed: ${error.message}, using original URL`);
            return longUrl;
        }
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
                        console.log(`🔗 Creating short link...`);
                        finalLink = await this.shortenUrl(result.link, song.title, song.artist);
                        if (finalLink !== result.link) {
                            shortenedLinks++;
                            console.log(`✓ Short link: ${finalLink}`);
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
        console.log('Usage: node create_affiliate_links_with_apple_short.js <input-file> [output-file]');
        console.log('');
        console.log('Environment variables:');
        console.log('  APPLE_MUSIC_AFFILIATE_TOKEN - Your Apple affiliate token (optional)');
        console.log('  USE_SHORT_LINKS - Set to "false" to disable URL shortening (default: true)');
        console.log('  SHORTENER_SERVICE - "apple" (automatic) or "tinyurl" (default: apple)');
        console.log('');
        console.log('Examples:');
        console.log('  node create_affiliate_links_with_apple_short.js plan_test.md');
        console.log('  SHORTENER_SERVICE=tinyurl node create_affiliate_links_with_apple_short.js plan_test.md');
        console.log('  USE_SHORT_LINKS=false node create_affiliate_links_with_apple_short.js plan_test.md');
        process.exit(1);
    }

    const inputFile = args[0];
    const outputFile = args[1] || inputFile.replace(/\.md$/, '_enhanced.md');

    if (!fs.existsSync(inputFile)) {
        console.error(`Error: Input file "${inputFile}" does not exist.`);
        process.exit(1);
    }

    const generator = new iTunesAffiliateLinkGeneratorWithAppleShort();
    
    try {
        const result = await generator.processMarkdownFile(inputFile, outputFile);
        console.log(`\n🎉 Success! Processed ${result.songsProcessed} songs.`);
        console.log(`📍 Direct links: ${result.directLinks}`);
        console.log(`🔍 Search links: ${result.searchLinks}`);
        if (USE_SHORT_LINKS) {
            console.log(`🔗 Short links: ${result.shortenedLinks}`);
        }
        console.log(`Enhanced file: ${result.outputFile}`);
        
        if (SHORTENER_SERVICE === 'apple') {
            console.log(`\n💡 Note: Apple short links are based on song titles and may not always work.`);
            console.log(`Test your links before using in production!`);
        }
    } catch (error) {
        console.error(`\n❌ Error: ${error.message}`);
        process.exit(1);
    }
}

// Export for use as module
module.exports = iTunesAffiliateLinkGeneratorWithAppleShort;

// Run if called directly
if (require.main === module) {
    main();
} 