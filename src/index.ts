import { YouTubeUploader } from "./YouTubeUploader.js";

(async () => {
    const uploader = new YouTubeUploader();
    const uploaded = await uploader.uploadVideo();

    
})();
