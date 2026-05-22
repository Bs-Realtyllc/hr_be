const express = require('express');
const router = express.Router();
const { handleStandupWebhook } = require('../controllers/discordWebhook');

// POST /api/discord/standup
// Receives Discord Webhook Events for daily standups.
// No JWT auth — Discord validates via Ed25519 signature headers instead.
router.post('/standup', handleStandupWebhook);

module.exports = router;
