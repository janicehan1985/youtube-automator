#!/usr/bin/env node

/**
 * YouTube Lofi Nature Video Automator - Simplified Version
 */

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

const CONFIG = {
    outputDir: './output',
    videosDir: './output/videos',
    musicDir: './output/music',
    tempDir: './output/temp',
    videoLength: 3600, // 1 hour
    youtube: {
        title: 'Lofi Nature - Cozy Study Music 1 Hour',
        description: `Perfect for studying, working, and relaxing. Enjoy this calming lofi session with beautiful nature visuals.

#lofi #studymusic #relaxation #nature`,
        tags: ['lofi', 'study music', 'relaxing', 'nature', 'chill', 'focus music'],
        privacyStatus: 'public'
    }
};

async function log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

async function ensureDirs() {
    await fs.ensureDir(CONFIG.videosDir);
    await fs.ensureDir(CONFIG.musicDir);
    await fs.ensureDir(CONFIG.tempDir);
}

function createVideoScript(outputFile) {
    // Create a shell script for FFmpeg to avoid escaping issues
    const script = `#!/bin/bash
ffmpeg -y \
    -f lavfi -i "color=c=#0a1628:s=1920x1080:d=${CONFIG.videoLength}" \
    -vf "fade=t=in:st=0:d=5,fade=t=out:st=${CONFIG.videoLength-5}:d=5" \
    -c:v libx264 \
    -preset fast \
    -crf 23 \
    -t ${CONFIG.videoLength} \
    -pix_fmt yuv420p \
    "${outputFile}"
`;
    return script;
}

async function createVideoWithFFmpeg(outputFile) {
    log('Creating video with FFmpeg...');
    
    const script = createVideoScript(outputFile);
    const scriptFile = path.join(CONFIG.tempDir, 'create-video.sh');
    
    await fs.writeFile(scriptFile, script);
    
    try {
        execSync(`bash "${scriptFile}"`, { stdio: 'inherit' });
        log('Video created successfully');
        return outputFile;
    } catch (error) {
        log('FFmpeg error: ' + error.message);
        throw error;
    }
}

async function generateThumbnail() {
    log('Generating thumbnail...');
    
    const thumbFile = path.join(CONFIG.videosDir, 'thumbnail.jpg');
    
    try {
        execSync(`ffmpeg -y -f lavfi -i "color=c=#0a1628:s=1280x720:d=5" -vf "fade=t=in:st=0:d=2,fade=t=out:st=3:d=2" -frames:v 1 "${thumbFile}"`, { stdio: 'inherit' });
        return thumbFile;
    } catch (error) {
        log('Thumbnail error: ' + error.message);
        return null;
    }
}

async function generateDailyVideo() {
    log('=== Starting Daily Video Generation ===');
    
    await ensureDirs();
    
    const timestamp = Date.now();
    const videoFile = path.join(CONFIG.videosDir, `lofi-nature-${timestamp}.mp4`);
    
    // Create video
    await createVideoWithFFmpeg(videoFile);
    
    // Generate thumbnail
    const thumbnailFile = await generateThumbnail();
    
    log('');
    log('=== Complete ===');
    log('Video: ' + videoFile);
    log('Size: ' + (fs.statSync(videoFile).size / 1024 / 1024).toFixed(2) + ' MB');
    log('');
    log('Next: Run "node upload-video.js" to upload to YouTube');
    
    return { videoFile, thumbnailFile };
}

if (require.main === module) {
    generateDailyVideo()
        .then(() => process.exit(0))
        .catch((error) => {
            log('Failed: ' + error.message);
            process.exit(1);
        });
}

module.exports = { generateDailyVideo, CONFIG };
