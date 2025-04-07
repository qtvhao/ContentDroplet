import { Browser, Page } from "puppeteer"
import { UploadFile } from 'puppeteerconnect.ts/dist/Utils/UploadFile.js'
import { WaitFor } from 'puppeteerconnect.ts/dist/Utils/WaitFor.js'
import { FindElement } from 'puppeteerconnect.ts/dist/Utils/FindElement.js'
import { PuppeteerConnect } from "puppeteerconnect.ts"

(async () => {
    const connect = new PuppeteerConnect()
    await connect.connectLocalBrowser();
    await connect.waitForPageLogin('https://studio.youtube.com/', 'studio.youtube.com');
    const page = await connect.getFirstPage()
    const url = page.url()

    const uploaded = UploadFile.uploadFile(page, url + '/videos/upload?d=ud', 'input[name="Filedata"]', 'task-b60f9d6f-9085-48a6-bcdf-f1a12b0a82b1.mp4')

    console.log(uploaded)

    await WaitFor.waitForTextInBody(page, 'Checks complete. No issues found.')

    const found = await FindElement.waitForElementContainingText(page, 'https://youtu.be/')

    let text = await page.evaluate(element => element.textContent, found);
    if (text) {
        text = text.replace(/\s+/g, ' ');
        console.log(text)
    }
})();
