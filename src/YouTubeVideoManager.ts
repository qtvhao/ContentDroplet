import { EditVideoDetails } from "./EditVideoDetails.js";
import { SaveVideo } from "./SaveVideo.js";
import { YouTubeUploader } from "./YouTubeUploader.js";

export class YouTubeVideoManager {
    private outputPath: string;
    private title: string;

    constructor(outputPath: string, title: string) {
        this.outputPath = outputPath;
        if (title.length > 100) {
            throw new Error('Title must be less than 100 characters.');
        }
        this.title = title;
    }

    private async updateVideoTitleAndSave(editor: EditVideoDetails): Promise<void> {
        await editor.makeChanges(this.title, '');
        await editor.clickButtonSave(await editor.connect.getFirstPage());
    }

    async run(): Promise<void> {
        const uploaded = await this.uploadVideo();
        const video = await this.saveVideo(uploaded);
        const editor = await this.prepareEditor(video);
        await this.tryUpdateTitle(editor);
        await this.finalizePublishing(editor);
    }

    private async uploadVideo(): Promise<any> {
        const uploader = new YouTubeUploader();
        const uploaded = await uploader.uploadVideo(this.outputPath);
        if (typeof uploaded === 'undefined') {
            throw new Error('Video upload failed: no response returned from YouTubeUploader.');
        }
        return uploaded;
    }

    private async saveVideo(uploaded: any): Promise<any> {
        const saveVideo = new SaveVideo(uploaded, 'Private');
        const vid = await saveVideo.run();
        if (typeof vid === 'undefined' || vid === null) {
            throw new Error('SaveVideo failed: received null or undefined video object.');
        }
        return vid;
    }

    async prepareEditor(video: any): Promise<EditVideoDetails> {
        const editor = new EditVideoDetails(video);
        await editor.connect.connectLocalBrowser();
        return editor;
    }

    async tryUpdateTitle(editor: EditVideoDetails): Promise<void> {
        let alreadyHaveTitle

        let retries = 5;
        while (retries-- > 0) {
            console.log('🔍 Checking if video already has the correct title:', { alreadyHaveTitle });
            alreadyHaveTitle = await editor.checkVideoAlreadyHaveTitle(this.title);
            console.log('✅ Pre-retry title check:', { alreadyHaveTitle, title: this.title });
            if (alreadyHaveTitle) {
                break;
            }
            await this.updateVideoTitleAndSave(editor);
            console.log('🔁 Retrying title update. Remaining attempts:', retries, 'Expected title:', this.title);
            await editor.connect.connectLocalBrowser();
            console.log('🌐 Reconnected browser after failed title update.');
        }
        if (!alreadyHaveTitle) {
            console.error('Final failure to update video title. Title attempted:', this.title);
            throw new Error('Failed to update video title after multiple attempts.');
        }
    }

    async finalizePublishing(editor: EditVideoDetails): Promise<void> {
        await editor.makePublic();
        console.log('🎉 Video processing and publishing succeeded! 🚀');
    }
}
