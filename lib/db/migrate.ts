import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import 'dotenv/config';

// Create a drizzle instance
const db = drizzle(process.env.DATABASE_URL!);

// Run migration
async function runMigration() {
  try {
    console.log('Starting migration...');
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();