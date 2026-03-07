# 🎬 Video Downloader

A fast, secure, and easy-to-use web-based video downloader that supports multiple platforms including YouTube, TikTok, Instagram, Facebook, Vimeo, Twitter, and more.

## ✨ Features

- **Multiple Format Support**: Download videos in MP4, WEBM, or extract audio as MP3
- **Quality Selection**: Choose from 144p up to 4K resolution (if available)
- **Multi-Platform Support**: YouTube (fully supported), TikTok, Instagram, Facebook, Vimeo, Twitter
- **Auto-Detection**: Automatically detects available resolutions and subtitles
- **No Registration Required**: Use the tool without creating an account
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Fast & Secure**: Built with security best practices and rate limiting
- **Free & Open Source**: No hidden costs or premium subscriptions

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone or navigate to the project directory**

```bash
cd c:\Users\pixel\Desktop\Belal\downloader
```

2. **Install dependencies**

```bash
npm install
```

3. **Create environment configuration**

Copy `.env.example` to `.env`:

```bash
copy .env.example .env
```

Edit `.env` if you want to customize settings:

```env
PORT=3000
NODE_ENV=development
MAX_FILE_SIZE=500
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=10
```

4. **Start the server**

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

5. **Open your browser**

Navigate to: `http://localhost:3000`

## 📖 How to Use

1. **Copy Video URL**: Go to YouTube, TikTok, Instagram, or any supported platform and copy the video URL
2. **Paste URL**: Paste the URL into the input field on the homepage
3. **Get Info**: Click "Get Video Info" to fetch available formats and qualities
4. **Select Options**: Choose your preferred format (MP4/WEBM/MP3) and quality
5. **Download**: Click the download button and save your video!

## 🎯 Supported Platforms

### Fully Supported (No Additional Setup)
- ✅ **YouTube** - Complete support with all features

### Requires yt-dlp Installation
- 🔶 **TikTok**
- 🔶 **Instagram**
- 🔶 **Facebook**
- 🔶 **Twitter/X**
- 🔶 **Vimeo**

### Installing yt-dlp for Full Platform Support

For complete support of all platforms, install yt-dlp:

**Windows:**
```bash
pip install yt-dlp
```

**macOS/Linux:**
```bash
pip install yt-dlp
# or
brew install yt-dlp
```

## 🛠️ API Endpoints

### Get Video Information
```http
POST /api/video-info
Content-Type: application/json

{
  "url": "https://youtube.com/watch?v=..."
}
```

**Response:**
```json
{
  "success": true,
  "platform": "youtube",
  "title": "Video Title",
  "thumbnail": "https://...",
  "duration": "300",
  "author": "Channel Name",
  "qualities": ["1080p", "720p", "480p", "360p"],
  "subtitles": [...],
  "availableFormats": ["mp4", "webm", "mp3"]
}
```

### Download Video
```http
POST /api/download
Content-Type: application/json

{
  "url": "https://youtube.com/watch?v=...",
  "format": "mp4",
  "quality": "1080p"
}
```

**Response:** Binary file stream

### Health Check
```http
GET /api/health
```

## 🏗️ Project Structure

```
downloader/
├── public/
│   ├── index.html      # Frontend HTML
│   ├── styles.css      # Responsive CSS styles
│   └── script.js       # Client-side JavaScript
├── server.js           # Express backend server
├── package.json        # Dependencies and scripts
├── .env.example        # Environment variables template
├── .gitignore          # Git ignore file
└── README.md           # This file
```

## 🔒 Security Features

- **Helmet.js**: Security headers protection
- **CORS**: Cross-Origin Resource Sharing enabled
- **Rate Limiting**: Prevents abuse (50 requests per 15 minutes per IP)
- **URL Validation**: Validates all input URLs
- **Input Sanitization**: Cleans file names and user inputs
- **No Data Storage**: Videos are streamed directly, not stored on server

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port number |
| `NODE_ENV` | development | Environment mode |
| `MAX_FILE_SIZE` | 500 | Maximum file size in MB |
| `RATE_LIMIT_WINDOW_MS` | 900000 | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | 10 | Max requests per window |

## 🚧 Troubleshooting

### Common Issues

**Issue**: "Failed to fetch video information"
- **Solution**: Check if the URL is correct and the video is publicly accessible

**Issue**: "Platform not fully supported"
- **Solution**: Install yt-dlp for full platform support (see above)

**Issue**: "Too many requests"
- **Solution**: Wait a few minutes before trying again (rate limit protection)

**Issue**: Download fails or is slow
- **Solution**: Try a lower quality option or check your internet connection

## 🎨 Customization

### Change Color Scheme

Edit `public/styles.css` and modify the CSS variables in `:root`:

```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    /* ... other variables */
}
```

### Add More Platforms

To add support for additional platforms, modify the `detectPlatform()` function in `server.js` and implement the corresponding download logic.

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## ⚠️ Disclaimer

This tool is for personal use only. Users are responsible for complying with:
- Copyright laws
- Terms of service of video platforms
- Local regulations regarding content downloading

Always respect content creators' rights and platform policies.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 📞 Support

If you encounter any issues or have questions:
1. Check the Troubleshooting section above
2. Review the console logs for error details
3. Ensure all dependencies are properly installed

## 🔮 Future Enhancements

- [ ] Batch download support
- [ ] Playlist download
- [ ] Subtitle download option
- [ ] Video preview before download
- [ ] Download history (client-side)
- [ ] Progress bar for large downloads
- [ ] Video format conversion
- [ ] Browser extension

## 🙏 Acknowledgments

Built with:
- [Express.js](https://expressjs.com/) - Web framework
- [ytdl-core](https://github.com/distube/ytdl-core) - YouTube downloader
- [Helmet.js](https://helmetjs.github.io/) - Security middleware
- [Express Rate Limit](https://github.com/nfriedly/express-rate-limit) - Rate limiting

---

Made with ❤️ for the community
