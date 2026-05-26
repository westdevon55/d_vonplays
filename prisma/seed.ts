/**
 * Seed two demo churches so the multi-tenant isolation can be tested
 * end-to-end. Runs as the superuser (SYSTEM_DATABASE_URL) so it can write
 * across all orgs.
 *
 *   joycenter @ joycenter.local — owner: pastor@joycenter.local / Password!1234
 *   gracehill @ gracehill.local — owner: pastor@gracehill.local / Password!1234
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "@node-rs/argon2";

const url = process.env.SYSTEM_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL or SYSTEM_DATABASE_URL must be set");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

async function hashPw(s: string) {
  return hash(s, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
}

async function wipe() {
  // Truncate in reverse-dependency order. CASCADE cleans the rest.
  const tables = [
    "FormSubmission","FormField","Form","Message","Campaign","MessageTemplate",
    "CheckinRecord","CheckinSession","EventRegistration","Event",
    "RecurringGift","Pledge","Donation","GivingBatch","Fund",
    "Availability","Schedule","Position","RunSheetItem","Service","ServiceType","Song",
    "AttendanceRecord","GroupAttendance","GroupMember","Group","GroupCategory",
    "CustomFieldValue","CustomField","Person","Family","PeopleCategory",
    "AuditLog","Invitation","Session","Membership","Subscription","Organization","User",
  ];
  for (const t of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${t}" RESTART IDENTITY CASCADE`);
  }
}

async function seedOrg(opts: {
  name: string;
  slug: string;
  ownerEmail: string;
  ownerName: string;
}) {
  const passwordHash = await hashPw("Password!1234");

  const org = await prisma.organization.create({
    data: {
      name: opts.name,
      slug: opts.slug,
      timezone: "America/New_York",
      currency: "USD",
      subscription: { create: { plan: "trial", trialEndsAt: new Date(Date.now() + 30 * 86400e3) } },
    },
  });

  const owner = await prisma.user.create({
    data: {
      email: opts.ownerEmail,
      name: opts.ownerName,
      passwordHash,
    },
  });

  await prisma.membership.create({
    data: { userId: owner.id, organizationId: org.id, role: "OWNER" },
  });

  // Categories, funds, service type, positions.
  const [membersCat, visitorsCat] = await Promise.all([
    prisma.peopleCategory.create({
      data: { organizationId: org.id, name: "Members", color: "#16a34a" },
    }),
    prisma.peopleCategory.create({
      data: { organizationId: org.id, name: "Visitors", color: "#0ea5e9" },
    }),
  ]);
  await prisma.groupCategory.createMany({
    data: [
      { organizationId: org.id, name: "Small Group" },
      { organizationId: org.id, name: "Ministry Team" },
    ],
  });
  const sundayType = await prisma.serviceType.create({
    data: { organizationId: org.id, name: "Sunday Service" },
  });
  await prisma.fund.createMany({
    data: [
      { organizationId: org.id, name: "General" },
      { organizationId: org.id, name: "Missions" },
      { organizationId: org.id, name: "Building" },
    ],
  });
  await prisma.position.createMany({
    data: [
      { organizationId: org.id, name: "Worship Leader" },
      { organizationId: org.id, name: "Audio" },
      { organizationId: org.id, name: "Greeter" },
      { organizationId: org.id, name: "Speaker" },
    ],
  });
  const generalFund = await prisma.fund.findFirstOrThrow({
    where: { organizationId: org.id, name: "General" },
  });

  // Families + people
  const johnsonFamily = await prisma.family.create({
    data: {
      organizationId: org.id,
      name: "Johnson Family",
      city: "Boston",
      state: "MA",
    },
  });
  const johnsonHead = await prisma.person.create({
    data: {
      organizationId: org.id,
      firstName: "Michael",
      lastName: "Johnson",
      email: `michael.johnson@${opts.slug}.local`,
      mobilePhone: "555-0100",
      familyId: johnsonFamily.id,
      familyRelation: "HEAD",
      categoryId: membersCat.id,
    },
  });
  await prisma.person.create({
    data: {
      organizationId: org.id,
      firstName: "Sarah",
      lastName: "Johnson",
      email: `sarah.johnson@${opts.slug}.local`,
      familyId: johnsonFamily.id,
      familyRelation: "SPOUSE",
      categoryId: membersCat.id,
    },
  });
  await prisma.person.create({
    data: {
      organizationId: org.id,
      firstName: "Emma",
      lastName: "Johnson",
      dateOfBirth: new Date("2017-03-12"),
      familyId: johnsonFamily.id,
      familyRelation: "CHILD",
      categoryId: membersCat.id,
    },
  });
  await prisma.person.createMany({
    data: [
      { organizationId: org.id, firstName: "Alice", lastName: "Brown", email: `alice@${opts.slug}.local`, categoryId: membersCat.id },
      { organizationId: org.id, firstName: "David", lastName: "Lee", email: `david@${opts.slug}.local`, categoryId: membersCat.id },
      { organizationId: org.id, firstName: "Priya", lastName: "Patel", email: `priya@${opts.slug}.local`, categoryId: visitorsCat.id },
    ],
  });

  // Songs
  await prisma.song.createMany({
    data: [
      { organizationId: org.id, title: "Amazing Grace", author: "John Newton", defaultKey: "G", lyrics: "Amazing grace, how sweet the sound..." },
      { organizationId: org.id, title: "Build My Life", author: "Pat Barrett", defaultKey: "E", lyrics: "Worthy of every song we could ever sing..." },
      { organizationId: org.id, title: "Goodness of God", author: "Bethel Music", defaultKey: "C", lyrics: "I love You, Lord..." },
    ],
  });

  // Group
  const group = await prisma.group.create({
    data: {
      organizationId: org.id,
      name: "Tuesday Night Small Group",
      meetingDay: "Tuesday",
      meetingTime: "7:00 PM",
      location: "Johnson Family Home",
    },
  });
  await prisma.groupMember.create({
    data: { groupId: group.id, personId: johnsonHead.id, role: "LEADER" },
  });

  // Service
  const nextSunday = new Date();
  nextSunday.setDate(nextSunday.getDate() + ((7 - nextSunday.getDay()) % 7 || 7));
  nextSunday.setHours(10, 0, 0, 0);
  const service = await prisma.service.create({
    data: {
      organizationId: org.id,
      serviceTypeId: sundayType.id,
      title: "Sunday Morning Worship",
      serviceDate: nextSunday,
    },
  });
  const songs = await prisma.song.findMany({ where: { organizationId: org.id }, take: 3 });
  await prisma.runSheetItem.createMany({
    data: [
      { serviceId: service.id, kind: "HEADING", title: "Pre-Service", position: 1 },
      { serviceId: service.id, kind: "SONG", title: songs[0]!.title, songId: songs[0]!.id, durationMinutes: 5, position: 2 },
      { serviceId: service.id, kind: "SONG", title: songs[1]!.title, songId: songs[1]!.id, durationMinutes: 5, position: 3 },
      { serviceId: service.id, kind: "HEADING", title: "Welcome", position: 4 },
      { serviceId: service.id, kind: "ITEM", title: "Announcements", durationMinutes: 5, position: 5 },
      { serviceId: service.id, kind: "ITEM", title: "Sermon", durationMinutes: 35, position: 6 },
      { serviceId: service.id, kind: "SONG", title: songs[2]!.title, songId: songs[2]!.id, durationMinutes: 5, position: 7 },
    ],
  });

  // A few donations spread across the year
  const fundId = generalFund.id;
  const months = 12;
  const donationsData = [];
  for (let i = 0; i < 30; i++) {
    const monthOffset = Math.floor(Math.random() * months);
    const day = 1 + Math.floor(Math.random() * 27);
    const date = new Date(new Date().getFullYear(), monthOffset, day);
    donationsData.push({
      organizationId: org.id,
      personId: johnsonHead.id,
      fundId,
      amountCents: [2500, 5000, 10000, 15000][Math.floor(Math.random() * 4)]!,
      method: "CHECK" as const,
      status: "COMPLETED" as const,
      donatedAt: date,
    });
  }
  await prisma.donation.createMany({ data: donationsData });

  console.log(`✓ Seeded ${opts.name} (slug=${opts.slug})`);
}

async function main() {
  console.log("Wiping existing data…");
  await wipe();
  await seedOrg({
    name: "Joy Center Church",
    slug: "joycenter",
    ownerEmail: "pastor@joycenter.local",
    ownerName: "Pastor Joy",
  });
  await seedOrg({
    name: "Grace Hill Fellowship",
    slug: "gracehill",
    ownerEmail: "pastor@gracehill.local",
    ownerName: "Pastor Grace",
  });
  console.log("\nDone. Log in with either:");
  console.log("  pastor@joycenter.local / Password!1234");
  console.log("  pastor@gracehill.local / Password!1234");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
