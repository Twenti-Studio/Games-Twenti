import express from 'express';
import prisma from '../database/prisma.js';
import { requireAuth } from './auth.js';

const router = express.Router();

// Get all settings (admin only)
router.get('/', requireAuth, async (req, res) => {
  try {
    const settings = await prisma.setting.findMany();
    
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });
    
    res.json(settingsObj);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single setting (admin only)
router.get('/:key', requireAuth, async (req, res) => {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: req.params.key }
    });
    
    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json({ key: setting.key, value: setting.value });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update setting (admin only)
router.put('/:key', requireAuth, async (req, res) => {
  try {
    const { value } = req.body;
    const { key } = req.params;

    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }

    const updated = await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });

    res.json({ key: updated.key, value: updated.value });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;