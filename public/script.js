// DOM Elements
const videoUrlInput = document.getElementById('videoUrl');
const getInfoBtn = document.getElementById('getInfoBtn');
const downloadBtn = document.getElementById('downloadBtn');
const errorMessage = document.getElementById('errorMessage');
const videoInfo = document.getElementById('videoInfo');
const videoThumbnail = document.getElementById('videoThumbnail');
const videoTitle = document.getElementById('videoTitle');
const videoAuthor = document.getElementById('videoAuthor');
const videoDuration = document.getElementById('videoDuration');
const platformBadge = document.getElementById('platformBadge');
const formatSelect = document.getElementById('formatSelect');
const qualitySelect = document.getElementById('qualitySelect');
const qualityGroup = document.getElementById('qualityGroup');
const subtitleInfo = document.getElementById('subtitleInfo');
const subtitleCount = document.getElementById('subtitleCount');

// API Base URL
const API_URL = window.location.origin;

// State
let currentVideoData = null;

// Utility Functions
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 5000);
}

function hideError() {
    errorMessage.classList.add('hidden');
}

function formatDuration(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function setButtonLoading(button, isLoading) {
    const btnText = button.querySelector('.btn-text');
    const spinner = button.querySelector('.spinner');
    
    if (isLoading) {
        btnText.classList.add('hidden');
        spinner.classList.remove('hidden');
        button.disabled = true;
    } else {
        btnText.classList.remove('hidden');
        spinner.classList.add('hidden');
        button.disabled = false;
    }
}

function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

function getPlatformName(platform) {
    const platforms = {
        'youtube': 'YouTube',
        'facebook': 'Facebook',
        'instagram': 'Instagram',
        'tiktok': 'TikTok',
        'vimeo': 'Vimeo',
        'twitter': 'Twitter/X',
        'unknown': 'Unknown Platform'
    };
    return platforms[platform] || platform;
}

// Event Listeners
getInfoBtn.addEventListener('click', getVideoInfo);

videoUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        getVideoInfo();
    }
});

formatSelect.addEventListener('change', (e) => {
    const format = e.target.value;
    
    // Hide quality selection for audio only
    if (format === 'mp3') {
        qualityGroup.style.display = 'none';
    } else {
        qualityGroup.style.display = 'flex';
    }
});

downloadBtn.addEventListener('click', downloadVideo);

// Main Functions
async function getVideoInfo() {
    const url = videoUrlInput.value.trim();
    
    // Validate URL
    if (!url) {
        showError('Please enter a video URL');
        return;
    }
    
    if (!isValidUrl(url)) {
        showError('Please enter a valid URL (starting with http:// or https://)');
        return;
    }
    
    hideError();
    setButtonLoading(getInfoBtn, true);
    videoInfo.classList.add('hidden');
    
    try {
        const response = await fetch(`${API_URL}/api/video-info`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || data.error || 'Failed to fetch video information');
        }
        
        if (data.success) {
            currentVideoData = data;
            displayVideoInfo(data);
        } else {
            throw new Error(data.message || 'Failed to fetch video information');
        }
        
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Failed to fetch video information. Please try again.');
    } finally {
        setButtonLoading(getInfoBtn, false);
    }
}

function displayVideoInfo(data) {
    // Display thumbnail and basic info
    if (data.thumbnail) {
        videoThumbnail.src = data.thumbnail;
        videoThumbnail.alt = data.title || 'Video thumbnail';
    }
    
    videoTitle.textContent = data.title || 'Video';
    
    // Author
    if (data.author) {
        videoAuthor.textContent = `By ${data.author}`;
    } else {
        videoAuthor.textContent = '';
    }
    
    // Duration
    if (data.duration) {
        videoDuration.textContent = `Duration: ${formatDuration(parseInt(data.duration))}`;
    } else {
        videoDuration.textContent = '';
    }
    
    // Platform badge
    platformBadge.textContent = getPlatformName(data.platform);
    
    // Populate quality options
    qualitySelect.innerHTML = '<option value="highest">Highest available</option>';
    
    if (data.qualities && data.qualities.length > 0) {
        data.qualities.forEach(quality => {
            const option = document.createElement('option');
            option.value = quality;
            option.textContent = quality;
            qualitySelect.appendChild(option);
        });
    } else {
        // Default quality options
        const defaultQualities = ['2160p (4K)', '1440p (2K)', '1080p (Full HD)', '720p (HD)', '480p', '360p', '240p', '144p'];
        defaultQualities.forEach(quality => {
            const option = document.createElement('option');
            option.value = quality;
            option.textContent = quality;
            qualitySelect.appendChild(option);
        });
    }
    
    // Subtitles info
    if (data.subtitles && data.subtitles.length > 0) {
        subtitleCount.textContent = `${data.subtitles.length} subtitle(s) available`;
        subtitleInfo.style.display = 'flex';
    } else {
        subtitleInfo.style.display = 'none';
    }
    
    // Show video info section
    videoInfo.classList.remove('hidden');
    
    // Scroll to video info
    videoInfo.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Show message for platforms that need yt-dlp
    if (data.message) {
        showError(data.message + ' ' + (data.note || ''));
    }
}

async function downloadVideo() {
    if (!currentVideoData) {
        showError('Please get video information first');
        return;
    }
    
    const url = videoUrlInput.value.trim();
    const format = formatSelect.value;
    const quality = qualitySelect.value;
    
    setButtonLoading(downloadBtn, true);
    hideError();
    
    try {
        // Create a temporary link to trigger download
        const downloadUrl = `${API_URL}/api/download`;
        
        const response = await fetch(downloadUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url, format, quality })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || errorData.error || 'Download failed');
        }
        
        // Get the filename from Content-Disposition header or use default
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `video.${format}`;
        
        if (contentDisposition) {
            // Match filename with or without quotes, handle both formats
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=\s*["']?([^"'\n;]+)["']?/);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1].trim();
            }
        }
        
        // Ensure filename has proper extension
        if (!filename.endsWith(`.${format}`)) {
            filename = `${filename}.${format}`;
        }
        
        // Convert response to blob and download
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
        
        // Show success message
        showSuccessMessage('Download started. Check your downloads folder.');
        
    } catch (error) {
        console.error('Download error:', error);
        showError(error.message || 'Download failed. Please try again or try a different quality/format.');
    } finally {
        setButtonLoading(downloadBtn, false);
    }
}

function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'wb-alert wb-alert--ok';
    successDiv.setAttribute('role', 'status');
    successDiv.textContent = message;
    
    errorMessage.parentNode.insertBefore(successDiv, errorMessage);
    
    setTimeout(() => {
        successDiv.remove();
    }, 5000);
}

// Smooth scrolling for navigation links
document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Check API health on load
async function checkAPIHealth() {
    try {
        const response = await fetch(`${API_URL}/api/health`);
        const data = await response.json();
        console.log('API Status:', data);
    } catch (error) {
        console.error('API health check failed:', error);
    }
}

// Initialize
checkAPIHealth();
