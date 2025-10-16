const { docClient, TABLES } = require('../config/dynamodb');
const personasData = require('../data/personas.json');

async function seedPersonas() {
  console.log('🌱 Seeding personas...\n');

  for (const persona of personasData.personas) {
    try {
      await docClient.put({
        TableName: TABLES.PERSONAS,
        Item: {
          personaId: persona.id,
          ...persona,
          createdAt: Date.now()
        }
      }).promise();
      
      console.log(`✅ ${persona.name}`);
    } catch (error) {
      console.error(`❌ ${persona.name}:`, error.message);
    }
  }

  console.log('\n🎉 Done!\n');
  process.exit(0);
}

seedPersonas();
