import "dotenv/config";
import { generateInstagramPost, generatePostIdeas } from "./content/generator.js";
import { postPhoto, getAccountInfo } from "./platforms/instagram.js";

// ─── Example: Full generate-and-post flow ─────────────────────────────────────

async function main() {
  const command = process.argv[2];

  if (command === "account") {
    // Verify your Instagram credentials are working
    const info = await getAccountInfo();
    console.log("✅ Connected to Instagram account:");
    console.log(`   @${info.username} — ${info.followers_count} followers`);
    return;
  }

  if (command === "ideas") {
    // Generate a batch of content ideas
    const ideas = await generatePostIdeas({
      theme: process.argv[3] ?? "mindfulness and wellness",
      count: 5,
      brand: "a wellness lifestyle brand",
    });
    console.log("\n💡 Content ideas:\n");
    ideas.forEach((idea, i) => {
      console.log(`${i + 1}. ${idea.topic}`);
      console.log(`   Angle: ${idea.angle}\n`);
    });
    return;
  }

  // Default: generate a caption and post to Instagram
  const topic = process.argv[3] ?? "morning routines that boost productivity";

  console.log(`\n✍️  Generating content for: "${topic}"\n`);

  const { fullPost, caption, hashtags } = await generateInstagramPost({
    topic,
    tone: "motivational and warm",
    brand: "WiseTribes — a community focused on growth and connection",
    hashtagCount: 10,
  });

  console.log("Generated caption:\n");
  console.log("─".repeat(60));
  console.log(fullPost);
  console.log("─".repeat(60));

  if (command === "generate") {
    // Just generate — don't post
    console.log("\n✅ Done! (run with 'post' to also publish to Instagram)");
    return;
  }

  if (command === "post") {
    // Requires a public image URL as the 4th argument
    const imageUrl = process.argv[4];
    if (!imageUrl) {
      console.error(
        "\n❌ Please provide a public image URL:\n" +
        "   node src/index.js post \"your topic\" https://your-image-url.jpg\n"
      );
      process.exit(1);
    }

    console.log("\n📤 Posting to Instagram...");
    const result = await postPhoto({ imageUrl, caption: fullPost });

    console.log("\n🎉 Posted successfully!");
    console.log(`   View post: ${result.permalink}`);
    return;
  }

  // No command given — just show help
  console.log(`
Usage:
  node src/index.js account                          — check Instagram connection
  node src/index.js generate "your topic"            — generate caption only
  node src/index.js post "your topic" <image-url>    — generate + post to Instagram
  node src/index.js ideas "your theme"               — brainstorm 5 post ideas
`);
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
