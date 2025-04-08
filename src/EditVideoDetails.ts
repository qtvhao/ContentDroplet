import { Page } from "puppeteer";
import { GetPageBodyText } from 'puppeteerconnect.ts/dist/Utils/GetPageBodyText.js'
import { PuppeteerConnect } from "puppeteerconnect.ts";

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
        await page.goto(`https://youtu.be/${this.vid}?t=36`)
        await page.waitForSelector('body');
        const innerText = await GetPageBodyText.getInnerText(page);
        return innerText.includes(title);
    }
}
