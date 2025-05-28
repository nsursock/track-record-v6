const iTunesAffiliateLinkGenerator = require('./create_affiliate_links_with_shortener.js');

// All songs from the plan
const songs = [
    { title: "Ball and Chain", artist: "Janis Joplin", genre: "blues" },
    { title: "Riders on the Storm", artist: "The Doors", genre: "psychedelic rock" },
    { title: "Ain't No Sunshine", artist: "Bill Withers", genre: "soul" },
    { title: "I Am the Walrus", artist: "The Beatles", genre: "psychedelic rock" },
    { title: "Teardrop", artist: "Massive Attack", genre: "trip hop" },
    { title: "Paranoid", artist: "Black Sabbath", genre: "heavy metal" },
    { title: "Comfortably Numb", artist: "Pink Floyd", genre: "progressive rock" },
    { title: "Back to Black", artist: "Amy Winehouse", genre: "soul" },
    { title: "Protection", artist: "Massive Attack", genre: "trip hop" },
    { title: "One", artist: "U2", genre: "rock" },
    { title: "Heroes", artist: "David Bowie", genre: "art rock" },
    { title: "I Shall Be Released", artist: "Nina Simone", genre: "jazz" },
    { title: "Let It Be", artist: "The Beatles", genre: "pop rock" },
    { title: "Kashmir", artist: "Led Zeppelin", genre: "rock" }
];

async function generateAllSongLinks() {
    console.log('🎵 Generating affiliate links for all songs from the plan\n');
    console.log('📋 Format: Both full and shortened versions provided\n');
    
    const generator = new iTunesAffiliateLinkGenerator();
    generator.useShortLinks = false; // Start with long links
    
    for (let i = 0; i < songs.length; i++) {
        const song = songs[i];
        console.log(`${i + 1}. "${song.title}" by ${song.artist} (${song.genre})`);
        
        try {
            // Get the full link
            const result = await generator.getAffiliateLink(song.title, song.artist);
            
            if (result.found) {
                console.log(`   ✅ Found: ${result.trackName} by ${result.artistName}`);
            } else {
                console.log(`   ⚠️  Search link (no exact match)`);
            }
            
            console.log(`   📏 Full Link: ${result.link}`);
            
            // Generate shortened version
            console.log(`   🔗 Creating shortened version...`);
            try {
                // Temporarily enable short links for this call
                const originalSetting = generator.useShortLinks;
                generator.useShortLinks = true;
                const shortLink = await generator.shortenUrl(result.link);
                generator.useShortLinks = originalSetting;
                console.log(`   📎 Short Link: ${shortLink}`);
            } catch (shortError) {
                console.log(`   ❌ Shortening failed: ${shortError.message}`);
                console.log(`   📎 Short Link: ${result.link} (using full link)`);
            }
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
        
        console.log(''); // Empty line for readability
        
        // Small delay to be respectful to APIs
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('🎉 All song links generated with both formats!');
    console.log('');
    console.log('💡 Usage Notes:');
    console.log('• Test shortened links first to verify click tracking works');
    console.log('• If shortened links don\'t register clicks, use full links');
    console.log('• Full links are confirmed working (25 clicks registered)');
}

// Run if called directly
if (require.main === module) {
    generateAllSongLinks().catch(console.error);
}

module.exports = { songs, generateAllSongLinks }; 