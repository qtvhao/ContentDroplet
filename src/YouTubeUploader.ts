import { Page } from "puppeteer"
import { UploadFile } from 'puppeteerconnect.ts/dist/Utils/UploadFile.js'
import { WaitFor } from 'puppeteerconnect.ts/dist/Utils/WaitFor.js'
import { FindElement } from 'puppeteerconnect.ts/dist/Utils/FindElement.js'
import { PuppeteerConnect } from "puppeteerconnect.ts"

export class YouTubeUploader {
    private connect: PuppeteerConnect;

    constructor() {
        this.connect = new PuppeteerConnect();
    }

    async uploadVideo(videoFilePath: string) {
        const browser = await this.connect.connectLocalBrowser();
        await this.connect.waitForPageLogin('https://studio.youtube.com/', 'studio.youtube.com');
        const page: Page = await this.connect.getFirstPage();
        const url = page.url();

        const uploaded = UploadFile.uploadFile(page, url + '/videos/upload?d=ud', 'input[name="Filedata"]', videoFilePath);

        console.log(uploaded);

        await WaitFor.waitForTextInBody(page, 'Checks complete. No issues found.');

        const found = await FindElement.waitForElementContainingText(page, 'https://youtu.be/');

        let text = await page.evaluate(element => element.textContent, found);
        if (text === null) {
            throw new Error("Failed to extract video URL text content from the element.");
        } else {
            text = text.replace(/\s+/g, ' ');
            console.log(text);
            await this.connect.disconnectBrowser(browser)
            await PuppeteerConnect.killAllChromeProcesses()

            return text
        }
    }
}
