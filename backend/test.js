const youtubedl = require('youtube-dl-exec');
const ffmpegStatic = require('ffmpeg-static');

async function test() {
    console.log('Testing merge with ffmpeg...');
    try {
        const subprocess = youtubedl.exec('https://www.facebook.com/share/r/1UM2EKAfPD/', {
            f: '2448223675685024v+bestaudio/best',
            o: 'test_fb2.mp4',
            mergeOutputFormat: 'mp4',
            ffmpegLocation: ffmpegStatic
        });
        
        subprocess.catch(err => {
            console.error('Failed:', err.message);
        });
        
        const result = await subprocess;
        console.log('Done!');
        console.log(result.stdout);
        console.log(result.stderr);
    } catch (e) {
        console.error('Error:', e.message);
    }
}
test();
