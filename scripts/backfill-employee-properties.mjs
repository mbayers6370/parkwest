import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const propertyKey = "580";

  const property = await prisma.property.upsert({
    where: {
      propertyKey,
    },
    update: {
      propertyName: "580",
      active: true,
    },
    create: {
      propertyKey,
      propertyName: "580",
      active: true,
    },
    select: {
      id: true,
      propertyKey: true,
      propertyName: true,
    },
  });

  const beforeCount = await prisma.employee.count({
    where: {
      propertyIdFk: null,
    },
  });

  const updateResult = await prisma.employee.updateMany({
    where: {
      propertyIdFk: null,
    },
    data: {
      propertyIdFk: property.id,
    },
  });

  const afterCount = await prisma.employee.count({
    where: {
      propertyIdFk: null,
    },
  });

  console.log(
    JSON.stringify(
      {
        propertyKey: property.propertyKey,
        propertyName: property.propertyName,
        unassignedBefore: beforeCount,
        updatedEmployees: updateResult.count,
        unassignedAfter: afterCount,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error("Employee property backfill failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
