import { SaveVideo } from "./SaveVideo.js";

const savePrivateVideo = new SaveVideo(
    'Video link https://youtu.be/-leSh7zUV1E Filename',
    'Private'
);
(async () => {
    const vid = await savePrivateVideo.run();

    console.log({vid})
})();
