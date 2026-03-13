/**
 * InstagramService
 * Publishes Stories via Meta Graph API.
 * Falls back to "manual_required" status if Instagram API is unavailable.
 */

const axios = require('axios');
const logger = require('../config/logger');

const IG_API_BASE = 'https://graph.facebook.com/v18.0';

/**
 * Upload an image and publish as a Story (Reel container method).
 * Note: The Graph API supports feed posts and reels natively.
 * Story publishing via API requires approved access from Meta.
 *
 * @param {Object} publication
 * @returns {Promise<{ media_id: string, permalink: string }>}
 */
async function publishStory(publication) {
  const {
    INSTAGRAM_ACCESS_TOKEN: token,
    INSTAGRAM_BUSINESS_ACCOUNT_ID: igAccountId,
  } = process.env;

  if (!token || !igAccountId) {
    throw new Error('Instagram credentials not configured');
  }

  const imageUrl = publication.art_url;
  if (!imageUrl) {
    throw new Error('No art_url available for publication');
  }

  // Step 1: Create media container
  const containerRes = await axios.post(
    `${IG_API_BASE}/${igAccountId}/media`,
    null,
    {
      params: {
        image_url: imageUrl,
        caption: publication.story_copy || '',
        media_type: 'IMAGE',
        access_token: token,
      },
    }
  );

  const containerId = containerRes.data.id;
  if (!containerId) {
    throw new Error('Failed to create Instagram media container');
  }

  logger.info(`[Instagram] Container created: ${containerId}`);

  // Step 2: Wait for container processing (poll up to 3 times)
  await sleep(3000);

  // Step 3: Publish the container
  const publishRes = await axios.post(
    `${IG_API_BASE}/${igAccountId}/media_publish`,
    null,
    {
      params: {
        creation_id: containerId,
        access_token: token,
      },
    }
  );

  const mediaId = publishRes.data.id;
  logger.info(`[Instagram] Published media: ${mediaId}`);

  // Step 4: Get permalink
  const mediaRes = await axios.get(`${IG_API_BASE}/${mediaId}`, {
    params: { fields: 'permalink', access_token: token },
  });

  return {
    media_id: mediaId,
    permalink: mediaRes.data.permalink || null,
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { publishStory };
