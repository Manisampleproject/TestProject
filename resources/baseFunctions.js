const { Builder, By, until, Key } = require('selenium-webdriver');

const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const moment = require('moment');

let o = new chrome.Options();
//o.addArguments('start-fullscreen');
o.addArguments('disable-infobars');
o.addArguments('headless'); // running test on visual chrome browser
o.setUserPreferences({ credential_enable_service: false });

var Page = function () {
    this.driver = new Builder()
        .setChromeOptions(o)
        .forBrowser('chrome')
        .build();

    // visit a webpage
    this.visit = async function (theUrl) {
        return await this.driver.get(theUrl);
    };

    // quit current session
    this.quit = async function () {
        return await this.driver.quit();
    };

    // find element by Id tag
    this.findById = async function (id) {
        await this.driver.wait(until.elementLocated(By.id(id)), 15000, 'Looking for element');
        return await this.driver.findElement(By.id(id));
    };

    // find element by Name tag
    this.findByName = async function (name) {
        await this.driver.wait(until.elementLocated(By.name(name)), 15000, 'Looking for element');
        return await this.driver.findElement(By.name(name));
    };

    //find element by class
    this.findByClassName = async function (className) {
        await this.driver.wait(until.elementLocated(By.className(className)), 15000, 'Looking for element');
        return await this.driver.findElement(By.className(className));
    }

    //find element by xpath
    this.findByXPath = async function (text) {
        await this.driver.wait(until.elementLocated(By.xpath(text)), 15000, 'Looking for element');
        return await this.driver.findElement(By.xpath(text));
    }

    // find element by data-cy tag
    // This is a custom function you need to add to selenium-webdriver/lib/by.js:
    /*   static datacy(datacy) {
        return By.css('*[data-cy="' + escapeCss(datacy) + '"]')
        } */
    this.findByDataCy = async function (datacy) {
        await this.driver.wait(until.elementLocated(By.datacy(datacy)), 15000, 'Looking for element');
        return await this.driver.findElement(By.datacy(datacy));
    };

    // fill input web elements
    this.write = async function (el, txt) {
        return await el.sendKeys(txt);
    };

    //select dropdown by text
    this.selectByText = async function (el, selectionText) {
        await el.click();
        //await sleep(1000);
        return await this.driver.findElement(By.xpath(`//*[text()='${selectionText}']`)).click();
    };


    //take screenshot
    this.screenshot = async function (imgname, screenshotpath) {
        
        const image = await this.driver.takeScreenshot();
        fs.writeFileSync(`${screenshotpath}` + imgname, image, 'base64');

    }


    //sleep
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    //timestamp
    this.timestamp = function () {
        //return moment().utc().format("dddd, MMMM Do YYYY, h:mm:ss a");
        return moment().format("YYYY-MM-DD[T]HH:mm:ss");
    };

    //clear text input
    this.clear = async function(el) {
        await this.driver.executeScript(elt => elt.select(), el);
        await el.sendKeys(Key.BACK_SPACE);
    }

    // select checkbox
    this.selectCheckbox = async function(el) {
        const actions = this.driver.actions({async: true});
        await actions.move({origin:el}).press().perform();
        await actions.release().perform();
    }

};

module.exports = Page;



