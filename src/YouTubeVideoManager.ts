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
        console.log('🎉 Video processing and publishing succeeded! 🚀');
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

    private async prepareEditor(video: any): Promise<EditVideoDetails> {
        const editor = new EditVideoDetails(video);
        await editor.connect.connectLocalBrowser();
        return editor;
    }

    private async tryUpdateTitle(editor: EditVideoDetails): Promise<void> {
        let alreadyHaveTitle = await editor.checkVideoAlreadyHaveTitle(this.title);
        console.log({ alreadyHaveTitle });

        let retries = 5;
        while (retries-- > 0) {
            await this.updateVideoTitleAndSave(editor);
            await editor.connect.connectLocalBrowser();
            alreadyHaveTitle = await editor.checkVideoAlreadyHaveTitle(this.title);
            console.log({ alreadyHaveTitle, title: this.title });
            if (alreadyHaveTitle) {
                break;
            }
        }
        if (!alreadyHaveTitle) {
            throw new Error('Failed to update video title after multiple attempts.');
        }
    }

    private async finalizePublishing(editor: EditVideoDetails): Promise<void> {
        const hasTitle = await editor.checkVideoAlreadyHaveTitle(this.title);
        if (hasTitle) {
            await editor.makePublic();
        }
    }
}
