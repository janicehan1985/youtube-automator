# 🌙 YouTube Lofi Nature Video Automator

Automated system to create and upload lofi nature videos to YouTube daily.

## Features

- 🎨 Beautiful animated nature visuals (stars, moon, mountains, trees)
- 🎵 Combines with lofi/chill music
- ⏰ Generates 1-hour videos automatically
- 📤 YouTube upload with titles, descriptions, tags
- 💬 Auto-comments (optional)

## Setup

### 1. Install Dependencies

```bash
cd youtube-automator
npm install
```

### 2. Install FFmpeg

Required for video processing:

```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

### 3. Setup YouTube API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project
3. Enable **YouTube Data API v3**
4. Go to Credentials → Create Credentials → OAuth client ID
5. Download JSON as `client_secrets.json`
6. Place in `youtube-automator/` folder

### 4. Generate First Video

```bash
node index.js
```

This creates a 1-hour video in `output/videos/`

### 5. Upload to YouTube

```bash
node upload-video.js
```

First run will open browser for OAuth authorization.

## Daily Automation

### Option 1: Cron (Linux/macOS)

```bash
# Edit crontab
crontab -e

# Add this line (runs at 8am daily)
0 8 * * * cd /path/to/youtube-automator && node index.js && node upload-video.js
```

### Option 2: Systemd Timer (Linux)

Create `/etc/systemd/system/youtube-automator.service`:

```ini
[Unit]
Description=Generate and upload lofi video

[Service]
Type=oneshot
WorkingDirectory=/root/clawd/youtube-automator
ExecStart=/usr/bin/node index.js && /usr/bin/node upload-video.js
User=root
```

### Option 3: GitHub Actions (Free!)

Create `.github/workflows/daily-video.yml`:

```yaml
name: Daily Video
on:
  schedule:
    - cron: '0 8 * * *'
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm install ffmpeg
      - run: npm start
        env:
          YOUTUBE_CLIENT_ID: ${{ secrets.YOUTUBE_CLIENT_ID }}
          YOUTUBE_CLIENT_SECRET: ${{ secrets.YOUTUBE_CLIENT_SECRET }}
```

## Project Structure

```
youtube-automator/
├── index.js           # Main video generator
├── upload-video.js    # YouTube uploader
├── visual.html       # Animation template
├── output/
│   ├── videos/     # Generated MP4 files
│   ├── music/       # Downloaded music
│   └── temp/        # Temporary files
├── client_secrets.json  # YouTube API credentials (you create this)
├── token.json         # OAuth token (auto-generated)
└── README.md
```

## Customization

### Change Visuals

Edit `visual.html` to modify:
- Colors and gradients
- Animation speed
- Elements (clouds, stars, mountains)
- Text and branding

### Change Music

In `index.js`, modify `MUSIC_SOURCES`:
```javascript
{
    name: 'Your Source',
    url: 'https://example.com/music',
    downloadUrl: 'https://direct-link-to-mp3.mp3'
}
```

Free music sources:
- [Pixabay Music](https://pixabay.com/music/search/lofi/)
- [Chosic](https://www.chosic.com/free-music/lofi/)
- [Free Stock Music](https://www.free-stock-music.com/lo-fi.html)

### Video Settings

In `index.js`, modify `CONFIG`:
```javascript
videoLength: 3600,  // seconds (1 hour = 3600)
youtube: {
    title: 'Your Custom Title',
    description: 'Your custom description',
    tags: ['tag1', 'tag2'],
    categoryId: '10',  // Music
    privacyStatus: 'public'
}
```

## YouTube Monetization Tips

1. **Upload daily** - Consistency helps algorithm
2. **Use tags** - #lofi, #studymusic, #relaxing
3. **Custom thumbnails** - Bright, readable text
4. **Playlists** - Create "1 Hour Study Music" playlist
5. **End screens** - Link to other videos
6. **Cards** - Promote new videos

## Troubleshooting

**FFmpeg not found**
```bash
export PATH=$PATH:/usr/local/bin  # or where ffmpeg is installed
```

**OAuth errors**
- Delete `token.json` and re-authenticate
- Make sure YouTube Data API is enabled

**Video too large**
- Increase CRF value in ffmpeg command (higher = smaller file)
- Reduce video length

## Automation Commands

```bash
# Generate video only
npm run generate

# Upload existing video
npm run upload

# Generate + upload
npm start
```

## License

MIT - Use freely, monetize as you wish!
