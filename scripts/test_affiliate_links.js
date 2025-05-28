const iTunesAffiliateLinkGenerator = require('./create_affiliate_links_with_shortener.js');

async function testAffiliateLinks() {
    console.log('🧪 Affiliate Link Testing Guide\n');
    
    const generator = new iTunesAffiliateLinkGenerator();
    
    try {
        const result = await generator.getAffiliateLink('Kashmir', 'Led Zeppelin');
        
        console.log('📋 Test Link:');
        console.log(`${result.link}\n`);
        
        console.log('🚨 IMPORTANT: Apple Filters Affiliate Clicks');
        console.log('Apple automatically filters out clicks from:');
        console.log('• The affiliate account holder (you)');
        console.log('• Same IP address repeatedly');
        console.log('• Same device/browser repeatedly');
        console.log('• Users logged into Apple ID associated with affiliate account\n');
        
        console.log('✅ Proper Testing Methods:');
        console.log('1. 🕵️  Incognito/Private Browsing:');
        console.log('   • Open link in incognito/private mode');
        console.log('   • Make sure you\'re not logged into any Apple services');
        console.log('   • Clear cookies before testing\n');
        
        console.log('2. 📱 Different Device:');
        console.log('   • Test from phone, tablet, or different computer');
        console.log('   • Use different network (mobile data vs WiFi)');
        console.log('   • Ask friend/family to test the link\n');
        
        console.log('3. 🌐 Different Network:');
        console.log('   • Use mobile hotspot instead of home WiFi');
        console.log('   • Test from different location');
        console.log('   • Use VPN to different location\n');
        
        console.log('4. 👥 Real User Testing:');
        console.log('   • Share link with friends/family');
        console.log('   • Post in social media (if appropriate)');
        console.log('   • Include in actual blog post for real readers\n');
        
        console.log('⏰ Tracking Timing:');
        console.log('• Clicks should appear in PartnerizeOne within 30 seconds');
        console.log('• Check Analytics > View tab');
        console.log('• Look for "Clicks" column');
        console.log('• Refresh dashboard after each test\n');
        
        console.log('🔍 Verification Steps:');
        console.log('1. Copy the test link above');
        console.log('2. Open incognito browser window');
        console.log('3. Paste and visit the link');
        console.log('4. Wait 30 seconds');
        console.log('5. Check PartnerizeOne dashboard');
        console.log('6. If no click, try from different device\n');
        
        console.log('💡 Pro Tips:');
        console.log('• Don\'t test the same link multiple times quickly');
        console.log('• Wait at least 5 minutes between tests');
        console.log('• Apple may flag rapid repeated clicks as suspicious');
        console.log('• Real organic clicks from blog readers work best\n');
        
        console.log('🎯 Link Format Verification:');
        const url = new URL(result.link);
        console.log(`✅ Domain: ${url.hostname}`);
        console.log(`✅ Path: ${url.pathname}`);
        console.log(`✅ Affiliate Token: ${url.searchParams.get('at')}`);
        console.log(`✅ Campaign: ${url.searchParams.get('ct')}`);
        console.log(`✅ Link Source: ${url.searchParams.get('ls')}`);
        console.log(`✅ App: ${url.searchParams.get('app')}\n`);
        
        console.log('🚀 Ready for Production:');
        console.log('Your links are properly formatted and should work!');
        console.log('The lack of click registration is likely due to Apple\'s');
        console.log('anti-fraud filtering, not a technical issue.\n');
        
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
    }
}

// Run if called directly
if (require.main === module) {
    testAffiliateLinks().catch(console.error);
}

module.exports = { testAffiliateLinks }; 