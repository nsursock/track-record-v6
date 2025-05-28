const iTunesAffiliateLinkGenerator = require('./create_affiliate_links_with_shortener.js');

async function testShortLinks() {
    console.log('🔗 Testing Short Links vs Long Links for Affiliate Tracking\n');
    
    // Test with short links enabled
    const generatorWithShort = new iTunesAffiliateLinkGenerator();
    generatorWithShort.useShortLinks = true;
    
    // Test with short links disabled  
    const generatorNoShort = new iTunesAffiliateLinkGenerator();
    generatorNoShort.useShortLinks = false;
    
    try {
        console.log('🎵 Testing: "Kashmir" by Led Zeppelin\n');
        
        // Get long link (working format)
        const longResult = await generatorNoShort.getAffiliateLink('Kashmir', 'Led Zeppelin');
        console.log('📏 Long Link (Known Working):');
        console.log(longResult.link);
        console.log('');
        
        // Get shortened link
        console.log('🔗 Creating shortened version...');
        const shortLink = await generatorWithShort.shortenUrl(longResult.link);
        console.log('📎 Shortened Link:');
        console.log(shortLink);
        console.log('');
        
        console.log('🧪 Testing Instructions:');
        console.log('1. First test the LONG link above (should work - 25 clicks registered)');
        console.log('2. Then test the SHORTENED link');
        console.log('3. Check PartnerizeOne dashboard after each test');
        console.log('4. Compare click registration between both formats');
        console.log('');
        
        console.log('⚠️  Important Notes:');
        console.log('• URL shorteners sometimes break affiliate tracking');
        console.log('• TinyURL redirects may not preserve all parameters');
        console.log('• If shortened links don\'t register clicks, use long links');
        console.log('• Test in incognito mode from different device for accuracy');
        console.log('');
        
        console.log('📊 Expected Results:');
        console.log('✅ Long link: Should register clicks (confirmed working)');
        console.log('❓ Short link: May or may not register clicks');
        console.log('');
        
        console.log('💡 Recommendation:');
        console.log('If short links don\'t register clicks, stick with long links.');
        console.log('Affiliate revenue is more important than link aesthetics!');
        
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
    }
}

// Run if called directly
if (require.main === module) {
    testShortLinks().catch(console.error);
}

module.exports = { testShortLinks }; 