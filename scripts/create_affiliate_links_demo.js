const fs = require('fs');
const path = require('path');

// Demo configuration - uses fallback search links
const DEMO_AFFILIATE_TOKEN = 'DEMO_TOKEN';

class AppleMusicAffiliateLinkGeneratorDemo {
    constructor() {
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

    // Create affiliate search link (demo version)
    createAffiliateSearchLink(songTitle, artistName, affiliateToken = DEMO_AFFILIATE_TOKEN) {
        const searchQuery = encodeURIComponent(`${songTitle} ${artistName}`);
        return `${this.affiliateUrl}/search?term=${searchQuery}&at=${affiliateToken}`;
    }

    // Process markdown file and add affiliate links (demo version)
    async processMarkdownFile(inputFilePath, outputFilePath) {
        try {
            console.log(`Processing file: ${inputFilePath}`);
            
            const content = fs.readFileSync(inputFilePath, 'utf8');
            const songs = this.extractSongMentions(content);
            
            console.log(`Found ${songs.length} song mentions`);

            let processedContent = content;
            let offset = 0;

            for (const song of songs) {
                console.log(`Creating search link for: "${song.title}" by ${song.artist}`);
                
                // Create affiliate search link
                const affiliateLink = this.createAffiliateSearchLink(song.title, song.artist);

                // Create the enhanced song mention with affiliate link
                const enhancedMention = `${song.fullMatch} [🎵 Listen on Apple Music](${affiliateLink})`;

                // Replace in content
                const originalIndex = song.index + offset;
                const beforeReplacement = processedContent.substring(0, originalIndex);
                const afterReplacement = processedContent.substring(originalIndex + song.fullMatch.length);
                
                processedContent = beforeReplacement + enhancedMention + afterReplacement;
                
                // Update offset for next replacements
                offset += enhancedMention.length - song.fullMatch.length;

                console.log(`✓ Added affiliate search link for "${song.title}"`);
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
        console.log('Usage: node create_affiliate_links_demo.js <input-file> [output-file]');
        console.log('');
        console.log('This is a demo version that creates Apple Music search links');
        console.log('without requiring API credentials.');
        console.log('');
        console.log('Example:');
        console.log('  node create_affiliate_links_demo.js plan_test.md plan_test_enhanced.md');
        process.exit(1);
    }

    const inputFile = args[0];
    const outputFile = args[1] || inputFile.replace(/\.md$/, '_enhanced.md');

    if (!fs.existsSync(inputFile)) {
        console.error(`Error: Input file "${inputFile}" does not exist.`);
        process.exit(1);
    }

    const generator = new AppleMusicAffiliateLinkGeneratorDemo();
    
    try {
        const result = await generator.processMarkdownFile(inputFile, outputFile);
        console.log(`\n🎉 Success! Processed ${result.songsProcessed} songs.`);
        console.log(`Enhanced file: ${result.outputFile}`);
        console.log(`\nNote: This demo uses search links. For direct song links,`);
        console.log(`use the full version with Apple Music API credentials.`);
    } catch (error) {
        console.error(`\n❌ Error: ${error.message}`);
        process.exit(1);
    }
}

// Export for use as module
module.exports = AppleMusicAffiliateLinkGeneratorDemo;

// Run if called directly
if (require.main === module) {
    main();
} 