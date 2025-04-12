import { EditVideoDetails } from "./EditVideoDetails.js";
import { SaveVideo } from "./SaveVideo.js";
import { YouTubeUploader } from "./YouTubeUploader.js";

export class YouTubeVideoManager {
    private outputPath: string;
    private title: string;

    constructor(outputPath: string, title: string) {
        this.outputPath = outputPath;
        this.title = title;
    }

    private async updateVideoTitleAndSave(editor: EditVideoDetails): Promise<void> {
        await editor.makeChanges(this.title, '');
        await editor.clickButtonSave(await editor.connect.getFirstPage());
    }

    async run(): Promise<void> {
        const uploader = new YouTubeUploader();
        const uploaded: any = await uploader.uploadVideo(this.outputPath);
        if (typeof uploaded === 'undefined') {
            throw new Error('Video upload failed: no response returned from YouTubeUploader.');
        }

        const saveVideo = new SaveVideo(uploaded, 'Private');
        const vid: any = await saveVideo.run();
        if (typeof vid === 'undefined' || vid === null) {
            throw new Error('SaveVideo failed: received null or undefined video object.');
        }

        const editor = new EditVideoDetails(vid);
        await editor.connect.connectLocalBrowser();
        let alreadyHaveTitle: boolean = await editor.checkVideoAlreadyHaveTitle(this.title);
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

        if (alreadyHaveTitle) {
            await editor.makePublic();
        }
    }
}
