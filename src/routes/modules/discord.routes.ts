import express from 'express';
const router = express.Router();
import { handleStandupWebhook, handleInternalStandup } from '../../controllers/discordWebhook.controller';

router.post('/standup', handleStandupWebhook);

router.post('/standup-submit', handleInternalStandup);

export default router;
