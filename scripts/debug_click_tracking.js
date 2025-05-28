const iTunesAffiliateLinkGenerator = require('./create_affiliate_links_with_shortener.js');

async function debugClickTracking() {
    console.log('🔍 Debug: Click Tracking Issues\n');
    
    const generator = new iTunesAffiliateLinkGenerator();
    
    try {
        const result = await generator.getAffiliateLink('Kashmir', 'Led Zeppelin');
        
        console.log('📋 Current Link:');
        console.log(`${result.link}\n`);
        
        const url = new URL(result.link);
        
        console.log('🔧 Parameter Check:');
        console.log(`✅ Domain: ${url.hostname}`);
        console.log(`✅ at: ${url.searchParams.get('at')}`);
        console.log(`✅ ct: ${url.searchParams.get('ct')}`);
        console.log(`✅ ls: ${url.searchParams.get('ls')}`);
        console.log(`✅ app: ${url.searchParams.get('app')}`);
        
        console.log('\n🚨 Potential Issues to Check:');
        console.log('1. Affiliate Token Status:');
        console.log('   • Is 1010lMoe still active in PartnerizeOne?');
        console.log('   • Has your affiliate account status changed?');
        console.log('   • Are you logged into the correct PartnerizeOne account?');
        
        console.log('\n2. Browser/Environment:');
        console.log('   • Are you testing from the same browser as before?');
        console.log('   • Any ad blockers or privacy settings blocking tracking?');
        console.log('   • Try incognito/private browsing mode');
        
        console.log('\n3. PartnerizeOne Dashboard:');
        console.log('   • Check Analytics > View tab');
        console.log('   • Look for clicks in last 24 hours');
        console.log('   • Try different time ranges');
        console.log('   • Check if filters are applied');
        
        console.log('\n4. Geographic/Technical:');
        console.log('   • Are you clicking from the same location as before?');
        console.log('   • Any VPN or proxy changes?');
        console.log('   • Try from different devices/networks');
        
        console.log('\n🧪 Test Steps:');
        console.log('1. Click the link above');
        console.log('2. Wait 30 seconds');
        console.log('3. Check PartnerizeOne Analytics immediately');
        console.log('4. If no click, try from incognito browser');
        console.log('5. If still no click, check affiliate account status');
        
        console.log('\n📞 If Nothing Works:');
        console.log('• Contact PartnerizeOne support directly');
        console.log('• Verify affiliate token is still valid');
        console.log('• Check if Apple changed tracking requirements');
        
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
    }
}

// Run the debug
if (require.main === module) {
    debugClickTracking().catch(console.error);
} 