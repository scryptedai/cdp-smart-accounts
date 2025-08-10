#!/usr/bin/env node

import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database Configuration (AWS RDS)
const DB_CONFIG = {
  host: process.env.POSTGRES_HOST || 'chibi-kingdom-postgres-production.ctqewhanuxo5.us-east-1.rds.amazonaws.com',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USERNAME || 'chibi_admin',
  password: process.env.POSTGRES_PASSWORD || 'ChibiProdDB2024SecurePass789',
  database: process.env.POSTGRES_DATABASE || 'chibi-kingdoms-prod',
  ssl: process.env.POSTGRES_SSL === 'require' ? { rejectUnauthorized: false } : false,
};

// Column definitions (try extended schema first, fallback to base)
const BASE_COLUMNS = [
  'id', 'player_id', 'score', 'nonce', 'killed_bosses', 'additional_info',
  'created_at', 'updated_at'
];

const EXTENDED_COLUMNS = [
  ...BASE_COLUMNS,
  'boss_mode_score', 'level', 'killed_enemies', 'play_time', 'is_naked',
  'level5_abilities', 'damage', 'health_healed', 'waves', 'is_boss_mode',
  'boss1', 'boss2', 'boss3', 'boss4', 'boss5', 'chests_opened', 'meat_buns',
  'medici', 'santiago', 'golden_snake', 'character'
];

async function connectToDatabase() {
  const client = new Client(DB_CONFIG);
  
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');
    return client;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
}

async function fetchLeaderboardData(client) {
  try {
    // Try extended schema first (April 2024+)
    console.log('📋 Attempting to fetch data with extended schema...');
    
    try {
      const extendedQuery = `SELECT ${EXTENDED_COLUMNS.join(', ')} FROM survivor.leader_board ORDER BY score DESC`;
      const result = await client.query(extendedQuery);
      console.log(`✅ Fetched ${result.rows.length} records with extended schema`);
      return { data: result.rows, columns: EXTENDED_COLUMNS, schema: 'extended' };
    } catch (extendedError) {
      console.log('⚠️ Extended schema failed, trying base schema...');
      
      // Fallback to base schema
      const baseQuery = `SELECT ${BASE_COLUMNS.join(', ')} FROM survivor.leader_board ORDER BY score DESC`;
      const result = await client.query(baseQuery);
      console.log(`✅ Fetched ${result.rows.length} records with base schema`);
      return { data: result.rows, columns: BASE_COLUMNS, schema: 'base' };
    }
  } catch (error) {
    console.error('❌ Failed to fetch leaderboard data:', error.message);
    throw error;
  }
}

function formatLeaderboardData(leaderboardResult) {
  const { data, columns, schema } = leaderboardResult;
  
  console.log(`\n🏆 LEADERBOARD DATA (${schema.toUpperCase()} SCHEMA)`);
  console.log('='.repeat(80));
  console.log(`📊 Total Records: ${data.length}`);
  console.log(`📋 Columns Available: ${columns.length}`);
  console.log(`🗃️ Schema Type: ${schema}`);
  
  if (data.length === 0) {
    console.log('📭 No leaderboard data found');
    return;
  }

  // Display column headers
  console.log('\n📋 Available Columns:');
  columns.forEach((col, index) => {
    console.log(`   ${(index + 1).toString().padStart(2, '0')}. ${col}`);
  });

  // Display top 10 records
  console.log('\n🥇 TOP 10 LEADERBOARD ENTRIES:');
  console.log('-'.repeat(120));
  
  const topRecords = data.slice(0, 10);
  
  topRecords.forEach((record, index) => {
    console.log(`\n🏅 Rank ${index + 1}:`);
    console.log(`   ID: ${record.id}`);
    console.log(`   Player ID: ${record.player_id}`);
    console.log(`   Score: ${record.score?.toLocaleString() || 'N/A'}`);
    
    if (schema === 'extended') {
      console.log(`   Boss Mode Score: ${record.boss_mode_score?.toLocaleString() || 'N/A'}`);
      console.log(`   Level: ${record.level || 'N/A'}`);
      console.log(`   Killed Enemies: ${record.killed_enemies?.toLocaleString() || 'N/A'}`);
      console.log(`   Play Time: ${record.play_time ? Math.round(record.play_time / 60) + ' minutes' : 'N/A'}`);
      console.log(`   Waves: ${record.waves || 'N/A'}`);
      console.log(`   Boss Mode: ${record.is_boss_mode ? 'Yes' : 'No'}`);
      console.log(`   Character: ${record.character || 'N/A'}`);
      
      if (record.boss1 || record.boss2 || record.boss3 || record.boss4 || record.boss5) {
        console.log(`   Boss Kills: B1:${record.boss1||0} B2:${record.boss2||0} B3:${record.boss3||0} B4:${record.boss4||0} B5:${record.boss5||0}`);
      }
    } else {
      console.log(`   Killed Bosses: ${record.killed_bosses || 'N/A'}`);
    }
    
    console.log(`   Created: ${record.created_at ? new Date(record.created_at).toLocaleString() : 'N/A'}`);
    console.log(`   Updated: ${record.updated_at ? new Date(record.updated_at).toLocaleString() : 'N/A'}`);
  });

  // Display statistics
  console.log('\n📊 LEADERBOARD STATISTICS:');
  console.log('-'.repeat(60));
  
  const scores = data.map(r => r.score).filter(s => s != null);
  if (scores.length > 0) {
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    console.log(`   Highest Score: ${maxScore.toLocaleString()}`);
    console.log(`   Lowest Score: ${minScore.toLocaleString()}`);
    console.log(`   Average Score: ${Math.round(avgScore).toLocaleString()}`);
  }

  if (schema === 'extended') {
    const playTimes = data.map(r => r.play_time).filter(t => t != null && t > 0);
    if (playTimes.length > 0) {
      const maxTime = Math.max(...playTimes);
      const minTime = Math.min(...playTimes);
      const avgTime = playTimes.reduce((a, b) => a + b, 0) / playTimes.length;
      
      console.log(`   Longest Play Time: ${Math.round(maxTime / 60)} minutes`);
      console.log(`   Shortest Play Time: ${Math.round(minTime / 60)} minutes`);
      console.log(`   Average Play Time: ${Math.round(avgTime / 60)} minutes`);
    }

    const bossModePlayers = data.filter(r => r.is_boss_mode === true).length;
    console.log(`   Boss Mode Players: ${bossModePlayers} (${Math.round(bossModePlayers / data.length * 100)}%)`);
    
    const characters = {};
    data.forEach(r => {
      if (r.character) {
        characters[r.character] = (characters[r.character] || 0) + 1;
      }
    });
    
    if (Object.keys(characters).length > 0) {
      console.log(`   Character Distribution:`);
      Object.entries(characters)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([char, count]) => {
          console.log(`     ${char}: ${count} players (${Math.round(count / data.length * 100)}%)`);
        });
    }
  }

  // Recent activity
  const recentRecords = data
    .filter(r => r.updated_at)
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 5);
    
  if (recentRecords.length > 0) {
    console.log('\n🕒 RECENT ACTIVITY (Last 5 Updates):');
    console.log('-'.repeat(60));
    
    recentRecords.forEach((record, index) => {
      const timeDiff = Math.round((Date.now() - new Date(record.updated_at)) / (1000 * 60));
      console.log(`   ${index + 1}. Player ${record.player_id}: ${record.score?.toLocaleString()} points (${timeDiff}m ago)`);
    });
  }
}

async function main() {
  console.log('🚀 Fetching Leaderboard Data from AWS RDS...\n');
  
  let client;
  
  try {
    // Connect to database
    client = await connectToDatabase();
    
    // Fetch leaderboard data
    const leaderboardResult = await fetchLeaderboardData(client);
    
    // Format and display data
    formatLeaderboardData(leaderboardResult);
    
    console.log('\n✅ Leaderboard data fetch completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
