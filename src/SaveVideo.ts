import { ClickButton, PuppeteerConnect } from "puppeteerconnect.ts";
import { ClickLabel } from "puppeteerconnect.ts";
import { Page } from "puppeteer";

export class SaveVideo {
    private vidText: string;
    private privacySetting: string;

    constructor(vidText: string, privacySetting: string) {
        this.vidText = vidText;
        this.privacySetting = privacySetting;
    }

    async run() {
        const connect = new PuppeteerConnect();
        const vid = this.extractYouTubeId(this.vidText);
        await connect.connectLocalBrowser();
        await connect.waitForPageLogin('https://studio.youtube.com/', 'studio.youtube.com');
        const page: Page = await connect.getFirstPage();
        const url = page.url();
        await page.goto(url + `/videos/upload?d=ud&udvid=${vid}`);
        await ClickButton.clickButtonMultipleTimes(page, '#next-button.ytcp-uploads-dialog', 3)
        await ClickLabel.clickElementByText(page, '#radioLabel', this.privacySetting);

        return vid;
    }

    private extractYouTubeId(text: string): string | null {
        const match = text.match(/(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/);
        return match ? match[1] : null;
    }
}
