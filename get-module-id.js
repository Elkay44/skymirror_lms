// Script to get a valid moduleId from the database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getModuleId() {
  try {
    // Get the first module from the database
    const modules = await prisma.module.findMany({
      take: 1,
    });
    
    if (modules && modules.length > 0) {
      console.log('Found module:', modules[0]);
      console.log('Module ID to use in tests:', modules[0].id);
      return modules[0].id;
    } else {
      console.log('No modules found in database');
    }
  } catch (error) {
    console.error('Error querying modules:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getModuleId();
