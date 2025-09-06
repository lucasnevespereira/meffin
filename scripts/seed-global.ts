import { seedGlobalCategories } from '../lib/seed-global-categories';

async function main() {
  try {
    await seedGlobalCategories();
    console.log('Global categories seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding global categories:', error);
    process.exit(1);
  }
}

main();