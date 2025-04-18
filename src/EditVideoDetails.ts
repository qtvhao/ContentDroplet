import { Page } from "puppeteer";
import { GetPageBodyText } from 'puppeteerconnect.ts/dist/Utils/GetPageBodyText.js'
import { ClickLabel, PuppeteerConnect } from "puppeteerconnect.ts";

export class EditVideoDetails {
    connect: PuppeteerConnect;
    vid: string;

    constructor(vid: string) {
        this.connect = new PuppeteerConnect();
        this.vid = vid;
    }

    async makeChanges(title: string, description: string) {
        await this.connect.connectLocalBrowser();
        await this.connect.waitForPageLogin('https://studio.youtube.com/', 'studio.youtube.com');
        const page: Page = await this.connect.getFirstPage();
        await page.goto(`https://studio.youtube.com/video/${this.vid}/edit`);
        if (!title || !description) {
            throw new Error('Title and Description must not be empty.');
        }
        let commonSelector = 'ytcp-form-input-container[focused] #outer.ytcp-form-input-container';
        await this.typeOnFocused(page, commonSelector, 'Title (required)', title);
        await this.typeOnFocused(page, commonSelector, 'Description', description);
    }

    async typeOnFocused(page: Page, selector: string, matcher: string, text: string) {
        for (let i = 0; i < 200; i++) {
            await page.keyboard.press('Tab');
            let $el = await page.$(selector);
            if ($el) {
                console.log('Focused:', $el);
                let borderColor = await page.evaluate(el => {
                    return getComputedStyle(el).borderColor;
                }, $el);
                let innerText = await page.evaluate(el => {
                    return (el as HTMLElement).innerText;
                }, $el);
                let inputsText = await page.evaluate(el => {
                    let inputs = Array.from(el.querySelectorAll('input'));
                    return inputs.map(input => input.placeholder);
                }, $el);
                innerText += " " + inputsText.join(' ');
                if (innerText.includes(matcher)) {
                    console.log('Typing:', text);
                    for (let i = 0; i < 5200; i++) {
                        await page.keyboard.press('ArrowRight');
                        await page.keyboard.press('Backspace');
                    }
                    await page.keyboard.type(text);
                    break;
                } else {
                    console.log('Inner text:', innerText);
                    console.log('Border color:', borderColor);
                }
            }
        }
        throw new Error(`Failed to find input field matching: ${matcher}`);
    }

    async clickButtonSave(page: Page, immediately_break = false) {
        let saveButton;
        while (typeof saveButton === 'undefined') {
            await new Promise(resolve => setTimeout(resolve, 10_000));
            console.log('Waiting for save button');
            let filledButtons = await page.$$('ytcp-button[type=filled]');
            for (let button of filledButtons) {
                let text = await page.evaluate(el => (el instanceof HTMLElement) ? el.innerText : '', button);
                if (text && text.toUpperCase() === 'SAVE') {
                    saveButton = button;
                    break;
                }
            }
            if (immediately_break) {
                console.log('🚨 Breaking from save button search loop early due to immediately_break flag.');
                break;
            }
        }
        if (saveButton) {
            await saveButton.click();
            await this.connect.disconnectBrowser(page.browser())
            await PuppeteerConnect.killAllChromeProcesses()
        } else {
            console.warn('Save button not found');
        }
    }
    async checkVideoAlreadyHaveTitle(title: string) {
        const page = await this.connect.getFirstPage();
        await page.goto(`https://youtu.be/${this.vid}?t=36`);
        await page.waitForSelector('body');

        const startTime = Date.now();
        const timeout = 15000;

        while (Date.now() - startTime < timeout) {
            const innerText = await GetPageBodyText.getInnerText(page);
            if (innerText.includes(title)) {
                return true;
            }
            await new Promise(r => setTimeout(r, 500));
        }

        const innerText = await GetPageBodyText.getInnerText(page);
        if (!innerText.includes(title)) {
            console.log('=+=')
            console.log(innerText, title)
        }

        return false;
    }
    async makePublic() {
        const selector = 'ytcp-video-metadata-visibility ytcp-icon-button'
        const page = await this.connect.getFirstPage();
        await page.goto(`https://studio.youtube.com/video/${this.vid}/edit`)
        // 
        await page.waitForSelector(selector, { timeout: 30000 });
        await page.bringToFront()
        for (let i = 0; i < 70 - 2; i++) {
            await new Promise(r => setTimeout(r, 100))
            console.log('Press Tab', i)
            await page.keyboard.press('Tab');
        }
        for (let i = 0; i < 1500; i++) {
            await new Promise(r => setTimeout(r, 2_000));
            await page.keyboard.press('Tab');
            console.log('Press Tab', i);
            let $el = await page.$(selector);
            if ($el) {
                let borderColor = await page.evaluate(el => {
                    return getComputedStyle(el).borderBottomColor;
                }, $el);

                if ('rgb(13, 13, 13)' === borderColor || 'rgb(255, 255, 255)' === borderColor) {
                    console.log({ borderColor })
                    break;
                }
            } else {
                throw new Error(`Failed to find input field matching: ${selector}`);
            }
        }
        await page.keyboard.press('Space')
        await new Promise(r=>setTimeout(r, 500))
        await ClickLabel.clickElementByText(page, '#radioLabel', "Public");

        await this.clickButtonDone()
        await new Promise(r=>setTimeout(r, 500))
        await this.clickButtonSave(page, false)
        
        console.log('✅ Video successfully made public.')
    }

    async clickButtonDone() {
        const page = await this.connect.getFirstPage();
        let doneButton;
        while (typeof doneButton === 'undefined') {
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log('Waiting for Done button');
            let buttons = await page.$$('button');
            for (let button of buttons) {
                let text = await page.evaluate(el => (el instanceof HTMLElement) ? el.innerText : '', button);
                if (text && text.toUpperCase().includes('DONE')) {
                    doneButton = button;
                    break;
                }
            }
        }
        if (doneButton) {
            await doneButton.click();
            console.log('✔️ Clicked Done button');
        } else {
            console.warn('Done button not found');
        }
    }
}
