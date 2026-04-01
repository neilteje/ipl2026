/**
 * Clear all cached bet lines for all matches
 * Run this after updating bet generation logic
 * 
 * Usage: node scripts/clear-all-bets.js
 */

async function clearAllBets() {
  console.log('🧹 Clearing all cached bet lines...\n');
  
  try {
    // First, clear the entire cache via admin endpoint
    console.log('📡 Calling admin clear-cache endpoint...');
    const clearResponse = await fetch('http://localhost:3000/api/admin/clear-cache', {
      method: 'POST',
    });
    
    if (clearResponse.ok) {
      const data = await clearResponse.json();
      console.log(`✅ ${data.message}\n`);
    } else {
      console.log(`⚠️  Clear cache failed (${clearResponse.status})\n`);
    }
    
    // Then regenerate bets for all matches
    const matches = [
      'ipl26-1', 'ipl26-2', 'ipl26-3', 'ipl26-4', 'ipl26-5',
      'ipl26-6', 'ipl26-7', 'ipl26-8', 'ipl26-9', 'ipl26-10',
      'ipl26-11', 'ipl26-12', 'ipl26-13', 'ipl26-14',
    ];
    
    console.log('🔄 Regenerating bets for all matches...\n');
    
    let regenerated = 0;
    let failed = 0;
    
    for (const matchId of matches) {
      try {
        const response = await fetch(`http://localhost:3000/api/bets/${matchId}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${matchId}: ${data.bets?.length || 0} bets regenerated`);
          regenerated++;
        } else {
          console.log(`⚠️  ${matchId}: Failed (${response.status})`);
          failed++;
        }
      } catch (error) {
        console.log(`❌ ${matchId}: ${error.message}`);
        failed++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Regenerated: ${regenerated}`);
    console.log(`   Failed: ${failed}`);
    console.log(`\n✨ All bet lines updated with new logic!`);
    console.log(`   Visit http://localhost:3000 to see updated bets\n`);
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

clearAllBets().catch(console.error);
