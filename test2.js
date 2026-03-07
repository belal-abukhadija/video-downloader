const youtubedl = require('youtube-dl-exec');
async function test() {
    try {
        console.log('Fetching info...');
        const info = await youtubedl('https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
            dumpJson: true,
            noWarnings: true
        });
        console.log('Success!', info.title, info.duration);
    } catch (err) {
        console.error('Error:', err.message);
    }
}
test();
