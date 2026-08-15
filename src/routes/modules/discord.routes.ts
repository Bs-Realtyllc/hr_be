import express from 'express';
const router = express.Router();
import { handleStandupWebhook, handleInternalStandup } from '../../controllers/discordWebhook.controller';

// POST /api/discord/standup — Discord Webhook Events endpoint (Ed25519 signature required)
router.post('/standup', handleStandupWebhook);

// POST /api/discord/standup-submit — called by the discord.js bot after confirming a standup
router.post('/standup-submit', handleInternalStandup);

export default router;
