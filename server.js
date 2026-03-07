const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const youtubedl = require('youtube-dl-exec');
const fs = require('fs');
const ffmpegPath = require('ffmpeg-static');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Ensure downloads directory exists
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// Helper function to validate URL
function isValidURL(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

// Helper function to detect platform
function detectPlatform(url) {
  const hostname = new URL(url).hostname.toLowerCase();

  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    return 'youtube';
  } else if (hostname.includes('facebook.com') || hostname.includes('fb.watch')) {
    return 'facebook';
  } else if (hostname.includes('instagram.com')) {
    return 'instagram';
  } else if (hostname.includes('tiktok.com')) {
    return 'tiktok';
  } else if (hostname.includes('vimeo.com')) {
    return 'vimeo';
  } else if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
    return 'twitter';
  }

  return 'unknown';
}

// API endpoint to get video information
app.post('/api/video-info', async (req, res) => {
  try {
    const { url } = req.body;

    // Validate URL
    if (!url || !isValidURL(url)) {
      return res.status(400).json({
        error: 'Invalid URL provided',
        message: 'Please enter a valid video URL'
      });
    }

    const platform = detectPlatform(url);

    try {
      const info = await youtubedl(url, { dumpJson: true, noWarnings: true });

      const videoFormats = (info.formats || [])
        .filter(f => f.vcodec !== 'none')
        .map(f => ({
          itag: f.format_id,
          quality: f.format_note || (f.height ? f.height + 'p' : 'unknown'),
          format: f.ext,
          hasVideo: true,
          hasAudio: f.acodec !== 'none',
          filesize: f.filesize || f.filesize_approx,
          fps: f.fps,
          resolution: f.height ? f.height + 'p' : f.format_note
        }));

      const audioFormats = (info.formats || [])
        .filter(f => f.vcodec === 'none' && f.acodec !== 'none')
        .map(f => ({
          itag: f.format_id,
          quality: f.abr ? f.abr + 'kbps' : 'audio',
          format: f.ext,
          hasVideo: false,
          hasAudio: true,
          filesize: f.filesize || f.filesize_approx
        }));

      const qualities = [...new Set(videoFormats
        .map(f => f.resolution)
        .filter(q => q && q !== 'unknown'))]
        .sort((a, b) => {
          const getVal = (str) => {
            const match = String(str).match(/(\d+)/);
            return match ? parseInt(match[1]) : 0;
          };
          return getVal(b) - getVal(a);
        });

      return res.json({
        success: true,
        platform,
        title: info.title,
        thumbnail: info.thumbnail,
        duration: info.duration,
        author: info.uploader || info.extractor,
        qualities,
        formats: {
          video: videoFormats,
          audio: audioFormats
        },
        subtitles: [],
        availableFormats: ['mp4', 'webm', 'mp3']
      });
    } catch (error) {
      console.error('Video info error:', error);
      return res.status(500).json({
        error: 'Failed to fetch video information',
        message: error.message
      });
    }

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// API endpoint to download video
app.post('/api/download', async (req, res) => {
  try {
    const { url, quality, format } = req.body;

    // Validate inputs
    if (!url || !isValidURL(url)) {
      return res.status(400).json({
        error: 'Invalid URL provided'
      });
    }

    if (!format || !['mp4', 'webm', 'mp3'].includes(format.toLowerCase())) {
      return res.status(400).json({
        error: 'Invalid format. Supported formats: MP4, WEBM, MP3'
      });
    }

    try {
      const info = await youtubedl(url, { dumpJson: true, noWarnings: true });
      let sanitizedTitle = (info.title || 'video')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_+|_+$/g, '')
        .substring(0, 100);

      if (!sanitizedTitle) sanitizedTitle = 'video';
      const filename = `${sanitizedTitle}.${format}`;

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', format === 'mp3' ? 'audio/mpeg' : `video/${format}`);

      let formatSelector = 'best';
      if (format === 'mp3') {
        formatSelector = 'bestaudio/best';
      } else {
        if (quality && quality !== 'highest') {
          const heightMatch = quality.match(/(\d+)/);
          if (heightMatch) {
            const height = heightMatch[1];
            formatSelector = `bestvideo[height<=${height}][ext=${format}]+bestaudio[ext=m4a]/best[height<=${height}][ext=${format}]/best`;
          } else {
            formatSelector = `bestvideo[ext=${format}]+bestaudio[ext=m4a]/best[ext=${format}]/best`;
          }
        } else {
          formatSelector = `bestvideo[ext=${format}]+bestaudio[ext=m4a]/best[ext=${format}]/best`;
        }
      }

      // We cannot pipe muxed video and audio directly because ffmpeg needs a seekable output to merge them.
      // So we download it to a temporary file, stream the completed file, and then delete it.
      const tempId = Math.random().toString(36).substring(7);
      const tempPath = path.join(downloadsDir, `temp_${tempId}.${format}`);

      const options = {
        output: tempPath,
        format: formatSelector,
        ffmpegLocation: ffmpegPath,
        noWarnings: true
      };

      if (format === 'mp3') {
        options.extractAudio = true;
        options.audioFormat = 'mp3';
      }

      try {
        await youtubedl(url, options);

        // Send the file to the client
        res.download(tempPath, filename, (err) => {
          if (err) {
            console.error('Error sending file:', err);
            if (!res.headersSent) {
              res.status(500).json({ error: 'Failed to send file' });
            }
          }
          // Clean up temp file
          fs.unlink(tempPath, (unlinkErr) => {
            if (unlinkErr) console.error('Error deleting temp file:', unlinkErr);
          });
        });
      } catch (dlError) {
        console.error('yt-dlp error:', dlError);
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
        if (!res.headersSent) {
          return res.status(500).json({
            error: 'Failed to process video download',
            message: dlError.message
          });
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      if (!res.headersSent) {
        return res.status(500).json({
          error: 'Failed to download video',
          message: error.message
        });
      }
    }

  } catch (error) {
    console.error('Error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    platform: 'All Platforms Supported Perfectly'
  });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Video Downloader Server running on http://localhost:${PORT}`);
  console.log(`📹 Supported platforms: YouTube, Facebook, Instagram, TikTok, Vimeo, Twitter (via yt-dlp)`);
});

module.exports = app;
