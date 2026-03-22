import axios from "axios";

const BASE_URL = "https://graph.facebook.com/v18.0";

function getCredentials() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  if (!token || !accountId) {
    throw new Error(
      "Missing Instagram credentials.\n" +
      "Set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ACCOUNT_ID in your .env file.\n" +
      "See .env.example for setup instructions."
    );
  }

  return { token, accountId };
}

/**
 * Post a photo to Instagram.
 * Instagram requires the image to be publicly accessible via a URL.
 *
 * @param {Object} options
 * @param {string} options.imageUrl  - Public URL of the image to post
 * @param {string} options.caption   - Full caption including hashtags
 * @returns {Promise<{ id: string, permalink: string }>}
 */
export async function postPhoto({ imageUrl, caption }) {
  const { token, accountId } = getCredentials();

  // Step 1: Create a media container
  console.log("📸 Creating Instagram media container...");
  const containerRes = await axios.post(
    `${BASE_URL}/${accountId}/media`,
    null,
    {
      params: {
        image_url: imageUrl,
        caption,
        access_token: token,
      },
    }
  );

  const creationId = containerRes.data.id;
  if (!creationId) {
    throw new Error(`Failed to create media container: ${JSON.stringify(containerRes.data)}`);
  }

  // Step 2: Wait briefly for media to be processed, then publish
  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log("🚀 Publishing post...");
  const publishRes = await axios.post(
    `${BASE_URL}/${accountId}/media_publish`,
    null,
    {
      params: {
        creation_id: creationId,
        access_token: token,
      },
    }
  );

  const postId = publishRes.data.id;

  // Step 3: Fetch the permalink
  const detailRes = await axios.get(`${BASE_URL}/${postId}`, {
    params: {
      fields: "permalink",
      access_token: token,
    },
  });

  return {
    id: postId,
    permalink: detailRes.data.permalink ?? `https://www.instagram.com/p/${postId}/`,
  };
}

/**
 * Post a video (Reel) to Instagram.
 * The video must be publicly accessible via a URL.
 *
 * @param {Object} options
 * @param {string} options.videoUrl  - Public URL of the video
 * @param {string} options.caption   - Full caption including hashtags
 * @param {string} [options.coverUrl] - Optional thumbnail image URL
 * @returns {Promise<{ id: string }>}
 */
export async function postReel({ videoUrl, caption, coverUrl }) {
  const { token, accountId } = getCredentials();

  console.log("🎬 Creating Instagram Reel container...");
  const params = {
    media_type: "REELS",
    video_url: videoUrl,
    caption,
    access_token: token,
  };

  if (coverUrl) {
    params.cover_url = coverUrl;
  }

  const containerRes = await axios.post(
    `${BASE_URL}/${accountId}/media`,
    null,
    { params }
  );

  const creationId = containerRes.data.id;

  // Poll until video is ready (can take 30–90 seconds)
  await waitForMediaReady(creationId, token);

  console.log("🚀 Publishing Reel...");
  const publishRes = await axios.post(
    `${BASE_URL}/${accountId}/media_publish`,
    null,
    { params: { creation_id: creationId, access_token: token } }
  );

  return { id: publishRes.data.id };
}

/**
 * Check the account's Instagram profile info.
 * Useful for verifying your credentials are working.
 */
export async function getAccountInfo() {
  const { token, accountId } = getCredentials();

  const res = await axios.get(`${BASE_URL}/${accountId}`, {
    params: {
      fields: "id,name,username,followers_count,media_count",
      access_token: token,
    },
  });

  return res.data;
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

async function waitForMediaReady(creationId, token, maxWaitMs = 90_000) {
  const interval = 5000;
  const maxAttempts = maxWaitMs / interval;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, interval));

    const statusRes = await axios.get(`${BASE_URL}/${creationId}`, {
      params: {
        fields: "status_code",
        access_token: token,
      },
    });

    const status = statusRes.data.status_code;
    console.log(`  Media status: ${status}`);

    if (status === "FINISHED") return;
    if (status === "ERROR") {
      throw new Error(`Instagram media processing failed for container ${creationId}`);
    }
  }

  throw new Error("Timed out waiting for Instagram media to be ready.");
}
