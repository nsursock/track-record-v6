const iTunesAffiliateLinkGenerator = require('./create_affiliate_links_with_shortener.js');

async function diagnoseAffiliateTracking() {
    console.log('🔍 Diagnosing Apple Music Affiliate Tracking Issues\n');
    
    const generator = new iTunesAffiliateLinkGenerator();
    
    // Test with Kashmir
    console.log('🎵 Testing Kashmir by Led Zeppelin...\n');
    
    try {
        const result = await generator.getAffiliateLink('Kashmir', 'Led Zeppelin');
        
        console.log('📋 Current Link Analysis:');
        console.log(`   Generated Link: ${result.link}`);
        
        const url = new URL(result.link);
        console.log('\n🔧 Parameter Analysis:');
        console.log(`   ✅ at (Affiliate Token): ${url.searchParams.get('at')}`);
        console.log(`   ✅ ct (Campaign): ${url.searchParams.get('ct')}`);
        console.log(`   ✅ ls (Link Source): ${url.searchParams.get('ls')}`);
        console.log(`   ✅ app (App Parameter): ${url.searchParams.get('app')}`);
        console.log(`   ℹ️  uo (User Origin): ${url.searchParams.get('uo')}`);
        console.log(`   ℹ️  i (Item ID): ${url.searchParams.get('i')}`);
        
        // Check for potential issues
        console.log('\n🚨 Potential Issues:');
        
        // Issue 1: Domain
        if (!url.hostname.includes('geo.music.apple.com')) {
            console.log('   ⚠️  Using music.apple.com instead of geo.music.apple.com');
            console.log('      Apple recommends geo.music.apple.com for global tracking');
        }
        
        // Issue 2: Parameter order
        const expectedOrder = ['at', 'ct', 'ls', 'app'];
        const actualParams = Array.from(url.searchParams.keys());
        console.log(`   ℹ️  Parameter order: ${actualParams.join(', ')}`);
        
        // Issue 3: Affiliate token format
        const affiliateToken = url.searchParams.get('at');
        if (affiliateToken && affiliateToken.length !== 8) {
            console.log(`   ⚠️  Affiliate token length: ${affiliateToken.length} (expected: 8)`);
        }
        
        // Issue 4: Campaign parameter
        const campaign = url.searchParams.get('ct');
        if (campaign && (campaign.includes('?') || campaign.includes('!') || campaign.includes('&'))) {
            console.log('   ⚠️  Campaign parameter contains forbidden characters (?, !, &)');
        }
        
        console.log('\n💡 Recommendations:');
        console.log('   1. Try using geo.music.apple.com domain for better global tracking');
        console.log('   2. Verify your affiliate token is exactly 8 characters');
        console.log('   3. Check PartnerizeOne dashboard after 5-10 minutes');
        console.log('   4. Consider using Apple Services Toolbox for comparison');
        console.log('   5. Test from different browsers/devices');
        
        // Generate alternative link with geo domain
        console.log('\n🌍 Alternative Link with geo domain:');
        const geoLink = result.link.replace('music.apple.com', 'geo.music.apple.com');
        console.log(`   ${geoLink}`);
        
        console.log('\n📞 If issues persist:');
        console.log('   • Contact Apple Performance Partners support');
        console.log('   • Verify your affiliate account status in PartnerizeOne');
        console.log('   • Check if your affiliate token is active and approved');
        console.log('   • Test with Apple Services Toolbox generated links');
        
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
    }
}

// Run the diagnostic
if (require.main === module) {
    diagnoseAffiliateTracking().catch(console.error);
} 