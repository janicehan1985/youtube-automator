#!/usr/bin/env node

/**
 * YouTube Manager - Web Server with Thumbnails Support
 */

const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const app = express();
const PORT = 3102;
const VIDEOS_DIR = '/root/clawd/output/videos';
const MUSIC_DIR = '/root/clawd/output/music';

app.use(express.json());

// API routes FIRST (before static)
app.get('/api/files', (req, res) => {
    try {
        // Videos
        const videos = fs.readdirSync(VIDEOS_DIR)
            .filter(f => f.endsWith('.mp4'))
            .map(f => {
                const stat = fs.statSync(path.join(VIDEOS_DIR, f));
                return { name: f, path: `/videos/${f}`, size: stat.size };
            })
            .sort((a, b) => b.name.localeCompare(a.name));
        
        // Music
        const music = fs.existsSync(MUSIC_DIR) 
            ? fs.readdirSync(MUSIC_DIR)
                .filter(f => f.endsWith('.mp3') || f.endsWith('.wav'))
                .map(f => {
                    const stat = fs.statSync(path.join(MUSIC_DIR, f));
                    return { name: f, path: `/music/${f}`, size: stat.size };
                })
                .sort((a, b) => b.name.localeCompare(a.name))
            : [];
        
        res.json({ videos, music });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/thumbnails', (req, res) => {
    try {
        const files = fs.readdirSync(VIDEOS_DIR)
            .filter(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.jpeg'))
            .map(f => {
                const stat = fs.statSync(path.join(VIDEOS_DIR, f));
                return {
                    name: f,
                    path: `/videos/${f}`,
                    size: stat.size,
                    created: stat.birthtime
                };
            })
            .sort((a, b) => new Date(b.created) - new Date(a.created));
        
        const totalSize = files.reduce((sum, f) => sum + f.size, 0);
        
        res.json({ thumbnails: files, totalSize });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Generate new thumbnail
app.post('/api/generate-thumbnail', (req, res) => {
    try {
        const thumbFile = path.join(VIDEOS_DIR, `thumbnail_${Date.now()}.jpg`);
        
        execSync(`ffmpeg -y -f lavfi -i "color=c=#0a1628:s=1280x720:d=5" -vf "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='CHRISTIAN LOFI':fontcolor=white:fontsize=64:x=(w-text_w)/2:y=(h-text_h)/2-30:shadowcolor=black:shadowx=2:shadowy=2,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='Relax • Worship • Peace':fontcolor='#40E0D0':fontsize=36:x=(w-text_w)/2:y=(h-text_h)/2+40:shadowcolor=black:shadowx=2:shadowy=2,fade=t=in:st=0:d=2,fade=t=out:st=3:d=2" -frames:v 1 "${thumbFile}"`, 
            { stdio: 'inherit' });
        
        res.json({ success: true, file: thumbFile });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get video stats
app.get('/api/stats', (req, res) => {
    try {
        const files = fs.readdirSync(VIDEOS_DIR).filter(f => f.endsWith('.mp4'));
        const totalSize = files.reduce((sum, f) => {
            try { return sum + fs.statSync(path.join(VIDEOS_DIR, f)).size; } catch { return sum; }
        }, 0);
        
        res.json({
            videoCount: files.length,
            totalSize,
            latestVideo: files.sort().reverse()[0]
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Static files AFTER API routes
const APP_DIR = __dirname;
app.use(express.static(APP_DIR));
app.use('/videos', express.static(VIDEOS_DIR));
app.use('/music', express.static(MUSIC_DIR));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`YouTube Manager: http://0.0.0.0:${PORT}`);
    console.log(`Videos: ${VIDEOS_DIR}`);
    console.log(`Music: ${MUSIC_DIR}`);
});
