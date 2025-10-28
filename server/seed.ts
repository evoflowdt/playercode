// Database seeding script for demo data
import { db } from "./db";
import { displays } from "@shared/schema";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Add demo displays
    const demoDisplays = [
      {
        name: "Store Entrance Display",
        hashCode: "ABC123456",
        status: "online" as const,
        os: "Samsung Tizen",
        location: "New York, USA",
        latitude: "40.7128",
        longitude: "-74.0060",
        resolution: "1920x1080",
        lastSeen: new Date(),
      },
      {
        name: "Lobby Screen",
        hashCode: "DEF789012",
        status: "online" as const,
        os: "LG webOS",
        location: "London, UK",
        latitude: "51.5074",
        longitude: "-0.1278",
        resolution: "3840x2160",
        lastSeen: new Date(),
      },
      {
        name: "Waiting Room TV",
        hashCode: "GHI345678",
        status: "offline" as const,
        os: "Android",
        location: "Tokyo, Japan",
        latitude: "35.6762",
        longitude: "139.6503",
        resolution: "1920x1080",
        lastSeen: new Date(Date.now() - 3600000),
      },
    ];

    for (const display of demoDisplays) {
      await db.insert(displays).values(display);
      console.log(`✓ Added display: ${display.name}`);
    }

    console.log("✅ Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
