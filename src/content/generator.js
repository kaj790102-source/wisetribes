import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

/**
 * Generate Instagram post content using Claude AI.
 *
 * @param {Object} options
 * @param {string} options.topic       - What the post is about
 * @param {string} [options.tone]      - e.g. "inspirational", "funny", "educational"
 * @param {string} [options.brand]     - Short brand/account description
 * @param {number} [options.hashtagCount] - How many hashtags to include (default 10)
 * @returns {Promise<{ caption: string, hashtags: string[], fullPost: string }>}
 */
export async function generateInstagramPost({
  topic,
  tone = "engaging and authentic",
  brand = "a lifestyle brand",
  hashtagCount = 10,
}) {
  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    system: `You are a social media expert who writes compelling Instagram captions for ${brand}.
Your captions are concise, drive engagement, and feel genuine — never robotic.
Always respond with valid JSON only. No markdown, no explanation.`,
    messages: [
      {
        role: "user",
        content: `Write an Instagram post about: "${topic}"
Tone: ${tone}
Include exactly ${hashtagCount} relevant hashtags.

Respond with this exact JSON shape:
{
  "caption": "the post text without hashtags",
  "hashtags": ["#tag1", "#tag2", ...],
  "callToAction": "a short CTA line (optional, can be empty string)"
}`,
      },
    ],
  });

  const raw = response.content.find((b) => b.type === "text")?.text ?? "{}";

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Fallback: treat entire output as caption
    return {
      caption: raw,
      hashtags: [],
      fullPost: raw,
    };
  }

  const { caption = "", hashtags = [], callToAction = "" } = parsed;
  const cta = callToAction ? `\n\n${callToAction}` : "";
  const fullPost = `${caption}${cta}\n\n${hashtags.join(" ")}`;

  return { caption, hashtags, callToAction, fullPost };
}

/**
 * Generate multiple post ideas for batch scheduling.
 *
 * @param {Object} options
 * @param {string} options.theme       - Overall content theme
 * @param {number} [options.count]     - Number of ideas (default 5)
 * @param {string} [options.brand]     - Short brand description
 * @returns {Promise<Array<{ topic: string, angle: string }>>}
 */
export async function generatePostIdeas({ theme, count = 5, brand = "a lifestyle brand" }) {
  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    system: `You are a creative social media strategist for ${brand}. Respond with valid JSON only.`,
    messages: [
      {
        role: "user",
        content: `Generate ${count} Instagram post ideas around the theme: "${theme}"

Respond with this exact JSON shape:
{
  "ideas": [
    { "topic": "specific post topic", "angle": "unique angle or hook" },
    ...
  ]
}`,
      },
    ],
  });

  const raw = response.content.find((b) => b.type === "text")?.text ?? "{}";
  try {
    const { ideas = [] } = JSON.parse(raw);
    return ideas;
  } catch {
    return [];
  }
}
