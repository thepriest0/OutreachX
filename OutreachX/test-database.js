// Quick test to verify the database schema includes the new delay_minutes column
import { storage } from './server/storage.js';
import { db } from './server/db.js';
import { emailCampaigns } from './shared/schema.js';

async function testDatabase() {
  try {
    console.log('🧪 Testing database connection and new schema...\n');
    
    // Get a sample campaign to see the schema
    const campaigns = await db
      .select()
      .from(emailCampaigns)
      .limit(1);
    
    if (campaigns.length > 0) {
      const campaign = campaigns[0];
      console.log('✅ Database connected successfully!');
      console.log('✅ Sample campaign structure:');
      console.log('   ID:', campaign.id);
      console.log('   Subject:', campaign.subject);
      console.log('   Follow-up delay (days):', campaign.followUpDelay);
      console.log('   Delay minutes:', campaign.delayMinutes);
      console.log('   Scheduled at:', campaign.scheduledAt);
      console.log('   Is follow-up:', campaign.isFollowUp);
      
      if (campaign.hasOwnProperty('delayMinutes')) {
        console.log('\n✅ SUCCESS: delay_minutes column is available!');
      } else {
        console.log('\n❌ WARNING: delay_minutes column not found');
      }
    } else {
      console.log('✅ Database connected successfully!');
      console.log('📝 No campaigns found yet (this is normal for new databases)');
      console.log('✅ Schema should include delay_minutes column');
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    
    if (error.message.includes('delay_minutes')) {
      console.log('\n💡 The delay_minutes column might need to be added manually.');
      console.log('   Try running the SQL: ALTER TABLE email_campaigns ADD COLUMN delay_minutes INTEGER;');
    }
  }
}

// Run the test
testDatabase().then(() => {
  console.log('\n🎉 Database test complete!');
  process.exit(0);
}).catch(console.error);
