import { Page } from "puppeteer";
import { PuppeteerConnect } from "puppeteerconnect.ts";

export class EditVideoDetails {
    connect: PuppeteerConnect;
    vid: string;

    constructor(vid: string) {
        this.connect = new PuppeteerConnect();
        this.vid = vid;
    }

    async makeChanges() {
        await this.connect.connectLocalBrowser();
        await this.connect.waitForPageLogin('https://studio.youtube.com/', 'studio.youtube.com');
        const page: Page = await this.connect.getFirstPage();
        await page.goto(`https://studio.youtube.com/video/${this.vid}/edit`);
    }
}
