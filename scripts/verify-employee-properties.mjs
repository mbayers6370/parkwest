import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.employee.groupBy({
    by: ["propertyIdFk"],
    _count: {
      _all: true,
    },
  });

  const propertyIds = rows
    .map((row) => row.propertyIdFk)
    .filter((value) => Boolean(value));

  const properties = propertyIds.length
    ? await prisma.property.findMany({
        where: {
          id: {
            in: propertyIds,
          },
        },
        select: {
          id: true,
          propertyKey: true,
          propertyName: true,
        },
      })
    : [];

  const propertyMap = new Map(properties.map((property) => [property.id, property]));

  const summary = rows.map((row) => {
    if (!row.propertyIdFk) {
      return {
        propertyKey: null,
        propertyName: null,
        employeeCount: row._count._all,
      };
    }

    const property = propertyMap.get(row.propertyIdFk);

    return {
      propertyKey: property?.propertyKey ?? row.propertyIdFk,
      propertyName: property?.propertyName ?? "Unknown",
      employeeCount: row._count._all,
    };
  });

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error("Employee property verification failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
