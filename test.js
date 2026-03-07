const ytdl = require('@distube/ytdl-core');
async function test() {
    try {
        console.log('Fetching info...');
        const info = await ytdl.getInfo('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        console.log('Success!', info.videoDetails.title);
    } catch (err) {
        console.error('Error:', err.message);
    }
}
test();
