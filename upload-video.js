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

// ============================================
// YOUTUBE UPLOAD TEMPLATES
// ============================================
// Usage: Set TEMPLATE_NAME to one of: 'lofi_nature', 'christian_lofi', 'worship', 'nature_ambient'
// ============================================

const TEMPLATE_NAME = process.argv[2] || 'christian_lofi';

const TEMPLATES = {
    // ----------------------------------------
    // Christian Lofi / Worship Channel
    // ----------------------------------------
    christian_lofi: {
        title: '🌙 Peaceful Worship Lofi - 1 Hour | Christian Meditation Music',
        description: `🙏 Welcome to peaceful Christian lofi worship music.

Perfect for:
• Prayer and meditation
• Quiet time with God
• Studying and reflection
• Sleeping and rest

🎵 Soothing lofi beats with faith-filled lyrics
✨ Find peace in His presence today

📖 "Be still, and know that I am God" - Psalm 46:10

#christianlofi #worshipmusic #peacefulmusic #christianmusic #faith #meditation`,
        tags: ['christian lofi', 'worship music', 'peaceful music', 'christian meditation', 'faith music', 'prayer music', 'christian ambient', 'sleep worship'],
        categoryId: '10', // Music
        privacyStatus: 'public',
        playlist: 'Christian Lofi Worship'
    },

    // ----------------------------------------
    // General Lofi Nature
    // ----------------------------------------
    lofi_nature: {
        title: '🌿 Lofi Nature Vibes - 1 Hour | Cozy Study & Relaxation',
        description: `🌿 Welcome to peaceful lofi nature vibes!

Perfect for:
• Studying and focus
• Working from home
• Meditation and yoga
• Sleeping and relaxation

🎶 Calming lofi beats with stunning nature visuals
✨ Sit back, breathe, and enjoy

#lofi #studymusic #nature #relaxation #chill #focusmusic #ambient #sleepmusic`,
        tags: ['lofi', 'study music', 'nature', 'relaxing', 'chill', 'focus music', 'ambient', 'sleep music', 'meditation'],
        categoryId: '10', // Music
        privacyStatus: 'public'
    },

    // ----------------------------------------
    // Nature Ambient / No Music
    // ----------------------------------------
    nature_ambient: {
        title: '🌊 Peaceful Ocean Waves - 2 Hours | Nature Sounds for Sleep & Relaxation',
        description: `🌊 Pure ocean waves for deep relaxation.

Features:
• Crystal clear ocean sounds
• No music - pure nature
• Perfect for sleeping
• Stress relief and meditation

🎧 Put on your headphones, close your eyes,
and let the waves wash your worries away

#oceansounds #naturesounds #sleepmusic #relaxation #meditation #whitenoise #stressrelief`,
        tags: ['ocean sounds', 'nature sounds', 'sleep music', 'relaxation', 'whitenoise', 'meditation', 'nature ambient', 'ocean waves'],
        categoryId: '10', // Music
        privacyStatus: 'public'
    },

    // ----------------------------------------
    // Christian Worship
    // ----------------------------------------
    worship: {
        title: '✝️ Uplifting Christian Worship - 1 Hour | Praise & Adoration',
        description: `✝️ Powerful worship music to lift your spirit.

Perfect for:
• Morning devotion
• Worship sessions
• Prayer time
• Encouragement

🎤 Let these songs draw you closer to God
🙏 May His presence fill your day

📖 "Enter His gates with thanksgiving" - Psalm 100:4

#christianworship #praiseandworship #christianmusic #worship2025 #godmusic #faith`,
        tags: ['christian worship', 'praise and worship', 'christian music', 'worship music', 'christian', 'god', 'faith', 'encouragement'],
        categoryId: '10', // Music
        privacyStatus: 'public'
    },

    // ----------------------------------------
    // Short Form (Shorts/Reels)
    // ----------------------------------------
    shorts: {
        title: '🌅 60-Second Peace | Morning Meditation',
        description: `🌅 Start your day with 60 seconds of peace.

#shorts #meditation #mindfulness #peace #morning #relax`,
        tags: ['shorts', 'meditation', 'peace', 'mindfulness', 'morning', 'relax', '60 seconds'],
        categoryId: '22', // People & Blogs
        privacyStatus: 'public',
        duration: 'short'
    },

    // ----------------------------------------
    // Bedtime Prayer / Sleep
    // ----------------------------------------
    bedtime_prayer: {
        title: '🌙 Sleep Prayer Meditation - 1 Hour | Rest in God\'s Presence',
        description: `🌙 Let go of the day and find peace in God's presence.

Perfect for:
• Falling asleep
• Night prayer
• Stress relief
• Spiritual rest

✨ Rest in His love as you sleep
🙏 Surrender your worries to Him

📖 "In peace I will lie down and sleep" - Psalm 4:8

#bedtimeprayer #sleep #christianmeditation #nightprayer #peace #godlove #spiritualrest`,
        tags: ['bedtime prayer', 'sleep', 'christian meditation', 'night prayer', 'peace', 'god love', 'spiritual rest', 'sleep worship', 'prayer music'],
        categoryId: '10', // Music
        privacyStatus: 'public',
        playlist: 'Sleep Prayer'
    },

    // ----------------------------------------
    // Morning Devotion
    // ----------------------------------------
    morning_devotion: {
        title: '☀️ Morning Devotional - 1 Hour | Start Your Day with God',
        description: `☀️ Begin your morning in His presence.

Perfect for:
• Morning routine
• Daily devotion
• Positive start
• Spiritual encouragement

🌅 Let His word guide your day
🙏 May God bless your day ahead

📖 "This is the day the Lord has made" - Psalm 118:24

#morningdevotion #morningprayer #devotional #god #faith #christian #startyourday #blessed`,
        tags: ['morning devotion', 'morning prayer', 'devotional', 'god', 'faith', 'christian', 'daily bread', 'spiritual morning', 'encouragement'],
        categoryId: '10', // Music
        privacyStatus: 'public',
        playlist: 'Morning Devotions'
    },

    // ----------------------------------------
    // Scripture Ambient
    // ----------------------------------------
    scripture_ambient: {
        title: '📖 Scripture Meditation - KJV | Psalm 23 - 1 Hour',
        description: `📖 Meditate on God's Word with peaceful ambient music.

Featured Scripture:
"The Lord is my shepherd; I shall not want.
He maketh me to lie down in green pastures..."

🎧 Listen and reflect on His promises
✨ Let His word sink into your heart

📖 Psalm 23 (KJV)

#scripture #psalm23 #bible #christian #meditation #godword #faith #kjv #biblemeditation`,
        tags: ['scripture', 'psalm 23', 'bible', 'christian meditation', 'god word', 'faith', 'kjv', 'bible meditation', 'word of god', 'bible study music'],
        categoryId: '10', // Music
        privacyStatus: 'public',
        playlist: 'Scripture Meditations'
    },

    // ----------------------------------------
    // Gospel Testimony
    // ----------------------------------------
    gospel_testimony: {
        title: '✝️ Gospel Music Mix - 1 Hour | Praise & Worship',
        description: `✝️ Uplifting gospel music to strengthen your faith.

Perfect for:
• Gospel music lovers
• Praise and worship
• Encouragement
• Spiritual upliftment

🎤 Feel the power of His love through music
🙏 Let the songs lift your spirit

#gospel #gospelmusic #christianmusic #praise #worship #god #faith #uplifting #blessed`,
        tags: ['gospel', 'gospel music', 'christian music', 'praise', 'worship', 'god', 'faith', 'uplifting', 'gospel mix', 'christian'],
        categoryId: '10', // Music
        privacyStatus: 'public',
        playlist: 'Gospel Mix'
    },

    // ----------------------------------------
    // Piano Worship
    // ----------------------------------------
    piano_worship: {
        title: '🎹 Peaceful Piano Worship - 1 Hour | Soft Christian Piano',
        description: `🎹 Beautiful piano melodies for worship and reflection.

Perfect for:
• Worship time
• Prayer
• Study
• Relaxation

✨ Let the gentle piano lead you to His presence
🙏 Pure worship music for your soul

#pianoworship #christianpiano #worshipmusic #piano #peaceful #god #faith #christianmusic`,
        tags: ['piano worship', 'christian piano', 'worship music', 'piano', 'peaceful', 'god', 'faith', 'christian music', 'instrumental', 'soft piano'],
        categoryId: '10', // Music
        privacyStatus: 'public',
        playlist: 'Piano Worship'
    },

    // ----------------------------------------
    // Nature + Faith (Combination)
    // ----------------------------------------
    nature_faith: {
        title: '🌿 Nature & Worship - 1 Hour | Scenic Views with Christian Lofi',
        description: `🌿 Stunning nature visuals with worship lofi beats.

Perfect for:
• Relaxation
• Nature appreciation
• Worship
• Background study

🍃 Beautiful nature scenes + faith-filled music
✨ Connect with God's creation

📖 "The heavens declare the glory of God" - Psalm 19:1

#nature #christianlofi #worship #natureviews #scenic #relax #faith #godcreation`,
        tags: ['nature', 'christian lofi', 'worship', 'nature views', 'scenic', 'relax', 'faith', 'god creation', 'nature worship', 'nature lofi'],
        categoryId: '10', // Music
        privacyStatus: 'public',
        playlist: 'Nature & Faith'
    }
};

// Get active template
function getVideoData() {
    const template = TEMPLATES[TEMPLATE_NAME] || TEMPLATES.christian_lofi;
    return {
        title: template.title,
        description: template.description,
        tags: template.tags,
        categoryId: template.categoryId,
        privacyStatus: template.privacyStatus
    };
}

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

    // Get template data
    const videoData = getVideoData();
    console.log('📝 Using template: ' + TEMPLATE_NAME);
    console.log('   Title: ' + videoData.title.substring(0, 50) + '...');

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
    console.log('📤 Uploading: ' + videoFile);

    const response = await fs.promises.readFile(videoFile);
    const video = response;

    const request = youtube.videos.insert({
        part: 'snippet,status',
        requestBody: {
            snippet: {
                title: videoData.title,
                description: videoData.description,
                tags: videoData.tags,
                categoryId: videoData.categoryId,
            },
            status: {
                privacyStatus: videoData.privacyStatus,
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

    // Show available templates
    console.log('📝 Available Templates:');
    Object.keys(TEMPLATES).forEach((key, i) => {
        console.log(`   ${i + 1}. ${key}: ${TEMPLATES[key].title.substring(0, 40)}...`);
    });
    console.log('');
    console.log('💡 Usage:');
    console.log('   node upload-video.js                    # Default (christian_lofi)');
    console.log('   node upload-video.js lofi_nature       # Lofi Nature template');
    console.log('   node upload-video.js worship           # Christian Worship template');
    console.log('   node upload-video.js nature_ambient    # Pure Nature Sounds');
    console.log('   node upload-video.js shorts            # Short form content');
    console.log('');

    authorize(async (auth) => {
        await uploadVideo(auth);
        await checkChannelStats(auth);
    });
}

module.exports = { uploadVideo, getVideoData, TEMPLATES, TEMPLATE_NAME };
