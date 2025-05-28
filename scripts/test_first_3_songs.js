const { songs } = require('./generate_all_song_links.js');
const iTunesAffiliateLinkGenerator = require('./create_affiliate_links_with_shortener.js');

async function testFirst3Songs() {
    console.log('🧪 Testing first 3 songs with both formats\n');
    
    const generator = new iTunesAffiliateLinkGenerator();
    
    for (let i = 0; i < 3; i++) {
        const song = songs[i];
        console.log(`${i + 1}. "${song.title}" by ${song.artist}`);
        
        try {
            const result = await generator.getAffiliateLink(song.title, song.artist);
            console.log(`   📏 Full Link: ${result.link}`);
            
            // Force shortening
            console.log(`   🔗 Creating shortened version...`);
            generator.useShortLinks = true;
            const shortLink = await generator.shortenUrl(result.link);
            console.log(`   📎 Short Link: ${shortLink}`);
            generator.useShortLinks = false;
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
        
        console.log('');
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('✅ Test complete!');
}

testFirst3Songs().catch(console.error); 