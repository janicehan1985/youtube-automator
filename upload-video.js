#!/usr/bin/env node

/**
 * YouTube Video Uploader
 * 
 * Requires:
 * 1. Google Cloud Project with YouTube Data API v3 enabled
 * 2. OAuth 2.0 credentials (client_secrets.json)
 * 3. Token storage (token.json)
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const readline = require('readline');

const SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];
const TOKEN_PATH = 'token.json';
const CLIENT_SECRETS_PATH = 'client_secrets.json';

// Default video data
const DEFAULT_VIDEO = {
    title: '🌙 Lofi Nature - Cozy Study Music 1 Hour',
    description: `🌙 Welcome to our peaceful lofi study session!

Perfect for:
• Studying and focus
• Working from home  
• Relaxation and meditation
• Sleep and relaxation

♫ Soothing lofi beats combined with calming nature visuals
✨ Sit back, relax, and enjoy

#lofi #studymusic #relaxation #nature #chill`,
    tags: ['lofi', 'study music', 'relaxing', 'nature', 'chill', 'focus music', 'ambient', 'sleep music'],
    categoryId: '10', // Music
    privacyStatus: 'public'
};

async function loadClientSecrets() {
    try {
        const content = await fs.promises.readFile(CLIENT_SECRETS_PATH);
        return JSON.parse(content);
    } catch (error) {
        console.log('client_secrets.json not found');
        console.log('Please download it from:');
        console.log('1. Go to https://console.cloud.google.com');
        console.log('2. Create a project or select existing');
        console.log('3. Enable YouTube Data API v3');
        console.log('4. Create OAuth 2.0 credentials');
        console.log('5. Download JSON and save as client_secrets.json');
        return null;
    }
}

async function loadToken() {
    try {
        const content = await fs.promises.readFile(TOKEN_PATH);
        return JSON.parse(content);
    } catch (error) {
        return null;
    }
}

async function saveToken(token) {
    await fs.promises.writeFile(TOKEN_PATH, JSON.stringify(token));
    console.log('Token stored at ' + TOKEN_PATH);
}

async function authorize(callback) {
    const credentials = await loadClientSecrets();
    
    if (!credentials) {
        console.log('\nOAuth setup required. Follow these steps:\n');
        console.log('1. Create Google Cloud Project:');
        console.log('   https://console.cloud.google.com');
        console.log('');
        console.log('2. Enable YouTube Data API:');
        console.log('   https://console.cloud.google.com/apis/library/youtube.googleapis.com');
        console.log('');
        console.log('3. Create OAuth credentials:');
        console.log('   https://console.cloud.google.com/apis/credentials');
        console.log('   → Create Credentials → OAuth client ID → Desktop app');
        console.log('');
        console.log('4. Download JSON as client_secrets.json');
        console.log('');
        console.log('5. Run this script again');
        return null;
    }
    
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    
    const token = await loadToken();
    
    if (token) {
        oauth2Client.setCredentials(token);
        await callback(oauth2Client);
    } else {
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });
        
        console.log('Authorize this app by visiting this URL:');
        console.log(authUrl);
        console.log('');
        
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        
        rl.question('Enter the code from that page: ', async (code) => {
            rl.close();
            
            try {
                const { tokens } = await oauth2Client.getToken(code);
                await saveToken(tokens);
                oauth2Client.setCredentials(tokens);
                await callback(oauth2Client);
            } catch (error) {
                console.log('Error getting token:', error.message);
            }
        });
    }
}

async function uploadVideo(auth) {
    const youtube = google.youtube({ version: 'v3', auth });
    
    // Find latest video file
    const videosDir = './output/videos';
    const files = await fs.promises.readdir(videosDir);
    const videoFiles = files.filter(f => f.endsWith('.mp4')).sort();
    
    if (videoFiles.length === 0) {
        console.log('No video files found in ' + videosDir);
        console.log('Run: node index.js to generate a video first');
        return;
    }
    
    const videoFile = path.join(videosDir, videoFiles[videoFiles.length - 1]);
    console.log('Uploading: ' + videoFile);
    
    const response = await fs.promises.readFile(videoFile);
    const video = response;
    
    const request = youtube.videos.insert({
        part: 'snippet,status',
        requestBody: {
            snippet: {
                title: DEFAULT_VIDEO.title,
                description: DEFAULT_VIDEO.description,
                tags: DEFAULT_VIDEO.tags,
                categoryId: DEFAULT_VIDEO.categoryId,
            },
            status: {
                privacyStatus: DEFAULT_VIDEO.privacyStatus,
                selfDeclaredMadeForKids: false,
            },
        },
        media: {
            body: video,
        },
    });
    
    try {
        const response = await request;
        console.log('\n✅ Upload successful!');
        console.log('Video ID: ' + response.data.id);
        console.log('URL: https://www.youtube.com/watch?v=' + response.data.id);
        
        // Generate comments
        await postComment(youtube, response.data.id);
        
    } catch (error) {
        console.log('Upload error:', error.message);
        if (error.response) {
            console.log('Details:', error.response.data.error.message);
        }
    }
}

async function postComment(youtube, videoId) {
    const comments = [
        "🌙 Hope you're enjoying this relaxing lofi session! What are you studying or working on today?",
        "✨ Take a deep breath and enjoy the peaceful vibes. Good luck with your work!",
        "☕ Perfect for focus and relaxation. Let us know if you need more content like this!",
        "🌿 Thanks for watching! Like and subscribe for more calming study music!",
    ];
    
    try {
        // Uncomment to enable auto-comments
        // await youtube.commentThreads.insert({
        //     part: 'snippet',
        //     requestBody: {
        //         snippet: {
        //             videoId: videoId,
        //             topLevelComment: {
        //                 snippet: {
        //                     textOriginal: comments[Math.floor(Math.random() * comments.length)]
        //                 }
        //             }
        //         }
        //     }
        // });
        console.log('\nNote: Auto-comments disabled by default');
        console.log('Edit upload-video.js to enable');
    } catch (error) {
        console.log('Comment error (non-critical):', error.message);
    }
}

async function checkChannelStats(auth) {
    const youtube = google.youtube({ version: 'v3', auth });
    
    try {
        const response = await youtube.channels.list({
            part: 'snippet,statistics',
            mine: true,
        });
        
        if (response.data.items && response.data.items.length > 0) {
            const channel = response.data.items[0];
            console.log('\n📊 Your Channel:');
            console.log('   Name: ' + channel.snippet.title);
            console.log('   Subscribers: ' + (channel.statistics.subscriberCount || 'N/A'));
            console.log('   Total views: ' + (channel.statistics.viewCount || 'N/A'));
            console.log('   Videos: ' + (channel.statistics.videoCount || 'N/A'));
        }
    } catch (error) {
        console.log('Channel stats error:', error.message);
    }
}

// Main
if (require.main === module) {
    console.log('=== YouTube Video Uploader ===\n');
    
    authorize(async (auth) => {
        await uploadVideo(auth);
        await checkChannelStats(auth);
    });
}

module.exports = { uploadVideo, DEFAULT_VIDEO };
