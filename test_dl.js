const youtubedl = require('youtube-dl-exec');
const fs = require('fs');

async function test() {
    const url = 'https://youtu.be/b6f5yjPs91A';
    const format = 'mp4';
    const tempPath = `test_temp.${format}`;
    const options = {
        output: tempPath,
        format: `bestvideo[ext=${format}]+bestaudio[ext=m4a]/best[ext=${format}]/best`,
        noWarnings: true
    };

    try {
        console.log('Downloading...');
        await youtubedl(url, options);
        console.log('Done downloading.');
        const files = fs.readdirSync('.');
        console.log('Files present:', files.filter(f => f.startsWith('test_temp')));
    } catch (err) {
        console.error('Error:', err);
    }
}
test();
