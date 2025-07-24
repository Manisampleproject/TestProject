const faker = require('faker');
let fs = require('fs');
const { WebDriver, Builder, until, By, logging } = require('selenium-webdriver');
let chrome = require('selenium-webdriver/chrome');
let firefox = require('selenium-webdriver/firefox');
const input = require('selenium-webdriver/lib/input');
const BUTTON = input.Button;
const KEY = input.Key;
let assert = require('chai').assert;
const addContext = require('mochawesome/addContext');
var argv = require('minimist')(process.argv.slice(2));
let MAX_TIMEOUT = 120000;
const width = 1920;
const height = 1080;
// let capabilities = require('../bs-config');
const browserstack = require('browserstack-local');
let bs_local = new browserstack.Local();
class ScriptHelper {
    currentTestName;
    currentTestStatus;
    scriptName;
    testData;
    mochatest;
    driver;
    configProperties = new Map();
    projectDirectory;
    numberRunId;
    RunId;
    testRunID;
    logger = new Map();
    ResultsPath;
    screenshotsFolderPath;
    testsSreenshotsFolderPath;
    testStatus = true;
    logPath;
    executionType = "browserstack"
    count = 1;
    constructor() { }

    async invokePreReq() {
        try {
            // let environmentxmlpath = await this.getCommandLineArgument("path") + "";
            await this.getConfigurationProperties();
            console.log(this.configProperties);
            await this.getProjectDirectory();
            await this.getUniqueNumberRunId();
            await this.getRunId();
            await this.createResultsFolder(this.scriptName);
            await this.createLogFile();
            await this.createScreenshotsFolder();
            this.logger.set("Completed Prerequisites", "all Passed");

        } catch (e) {
            this.logger.set("Error occured in Prerequisites", e);
            console.log(e)
        }
    }

    async beforeEachTest() {
        addContext(this.mochatest, this.scriptName + " RunID is: " + this.RunId + "\n" + this.ResultsPath);
        try {
            await this.startTestExecution(this.currentTestName);
            this.testStatus = true;
        } catch (e) {
            await this.log("Failed while logging in to Application   - Failed" + e);
            new Error(e);
            this.testStatus = false;
        }
    }

    async afterEachTest() {
        if (this.mochatest.currentTest.state == "failed") {
            if (this.executionType == "browserstack") {
                await this.driver.executeScript('browserstack_executor: {"action": "setSessionStatus", "arguments": {"status":"failed","reason":"test execution is completed and failed"}}');
            }
        }
        else {
            if (this.executionType == "browserstack") {
                await this.driver.executeScript('browserstack_executor: {"action": "setSessionStatus", "arguments": {"status":"passed","reason":"test execution is completed and passed"}}');
            }
        }
        this.logger.clear();
        this.count = 1;
        if (this.executionType == "browserstack") {
            bs_local.stop(function () {
                console.log("Stopped BrowserStackLocal");
            });
        }
    }

    async afterTests() { }


    async startTestExecution(testcaseName) {
        await this.getTestRunId();
        await this.createTestFolder(this.screenshotsFolderPath + "/" + testcaseName);
        await this.launchBrowser();
    }

    async getCommandLineArgument(commandLineArgument) {
        let v_CmdArgs = process.argv;
        console.log(v_CmdArgs)
        let v_ArgumentValue = "";
        let v_ArgumentFound = false;
        for (let i = 0; i < v_CmdArgs.length; i++) {
            if (v_CmdArgs[i].includes(commandLineArgument) && v_CmdArgs[i].includes("--")) {
                v_ArgumentFound = true;
                try {
                    console.log(v_CmdArgs[i] + " - " + commandLineArgument)
                    v_ArgumentValue = v_CmdArgs[i].split("=")[1].trim();
                    v_ArgumentValue = v_ArgumentValue.split(",")[0].trim();
                }
                catch (e) {
                    console.log("Error occurred while reading command-line arguments"); i = i + 1;
                    try {
                        v_ArgumentValue = v_ArgumentValue.split("=")[0].trim();
                        v_ArgumentFound = true;
                    }
                    catch (e) {
                    }
                }
                console.log("Command-line argument:=" + commandLineArgument + " and it's value:=" + v_ArgumentValue);
                break;
            }
        }
        return v_ArgumentValue;
    }

    async log(message) {
        if (this.logpath == null) {
            this.logpath = (await this.getResultsPath()) + "/log.txt";
        }
        fs.appendFileSync(this.logpath, message + "\n");
        this.logger.set(this.count + ": " + this.getTimeStamp() + " - ", message);
        addContext(this.mochatest, {
            title: 'Info',
            value: {
                time: this.getTimeStamp(),
                message: message
            }
        });
    }

    async logSuccess(message) {
        if (this.logpath == null) {
            this.logpath = (await this.getResultsPath()) + "/log.txt";
        }
        fs.appendFileSync(this.logpath, message + ": Passed" + "\n");
        this.logger.set(this.count + ": " + this.getTimeStamp() + " : " + message, "Passed");
        if (this.executionType == "browserstack") {
            addContext(this.mochatest, {
                title: 'Passed',
                value: {
                    time: this.getTimeStamp(),
                    message: message
                }
            });
        } else {
            let screenshotpath = await this.takeScreenshot(this.count + "_Passed");
            this.logger.set("ScreenshotPath_" + this.count, "<" + screenshotpath + ">");
            addContext(this.mochatest, {
                title: 'Passed',
                value: {
                    time: this.getTimeStamp(),
                    message: message,
                    screenshotpath: screenshotpath
                }
            });
            addContext(this.mochatest, screenshotpath)
            this.count++;
        }

    }

    async logFailure(message) {
        if (this.logpath == null) {
            this.logpath = (await this.getResultsPath()) + "/log.txt";
        }
        fs.appendFileSync(this.logpath, message + ": Failed" + "\n");
        this.testStatus = false;

        if (this.executionType == "browserstack") {
            addContext(this.mochatest, {
                title: 'Failed',
                value: {
                    time: this.getTimeStamp(),
                    message: message
                }
            });
        }
        else {
            let screenshotpath = await this.takeScreenshot(this.count + "_Failed");
            this.logger.set(this.count + ": " + this.getTimeStamp() + " : " + message, "Failed");
            this.logger.set("ScreenShot Path - " + this.count, "<" + screenshotpath + ">");
            this.count++;
            addContext(this.mochatest, {
                title: 'Failed',
                value: {
                    time: this.getTimeStamp(),
                    message: message,
                    screenshotpath: screenshotpath
                }
            });
            addContext(this.mochatest, screenshotpath)
        }
    }

    async getConsoleLogs() {
        if (this.executionType !== "browserstack") {
            let frm = this;
            await this.driver.manage().logs().get(logging.Type.BROWSER).then(function (entries) {
                entries.forEach(async function (entry) {
                    let date = new Date(entry.timestamp);
                    await frm.log("consolelogs: " + date.toLocaleString() + "\n" + entry.level.name + "\n" + entry.message);
                });
            });
        }
    }

    getTimeStamp() {
        let date = new Date();
        let timestamp = date.getUTCMilliseconds().toString();
        timestamp += date.getUTCFullYear().toString();
        timestamp += date.getUTCMonth().toString();
        timestamp += date.getUTCDate().toString();
        timestamp += date.getUTCHours().toString();
        timestamp += date.getUTCMinutes().toString();
        timestamp += date.getUTCSeconds().toString();
        return date.toString();
    }

    getResultsPath() {
        return this.ResultsPath;
    }

    async getConfigurationProperties() {
        let browser = await this.getCommandLineArgument("browser")
        console.log("test")
        if (browser !== undefined && browser != "")
            this.configProperties.set("Browser", browser);
        else
            this.configProperties.set("Browser", "headlesschrome");
        this.logger.set("getConfigurationProperties", "Configuration properties" + "\n");
        let frm = this;
        this.configProperties.forEach(function (value, key) {
            frm.logger.set(key, "" + value);
        })
    }

    async getProjectDirectory() {
        let path = __dirname;
        this.projectDirectory = path.split("/resources")[0];
        this.logger.set(this.projectDirectory, "- is the project directory");
        this.logger.set('getProjectDirectory', '' + this.projectDirectory);
    }

    async getUniqueNumberRunId() {
        let date = new Date();
        let timestamp = date.getUTCMilliseconds().toString();
        timestamp += date.getUTCFullYear().toString();
        timestamp += date.getUTCMonth().toString();
        timestamp += date.getUTCDate().toString();
        timestamp += date.getUTCHours().toString();
        timestamp += date.getUTCMinutes().toString();
        timestamp += date.getUTCSeconds().toString();
        this.numberRunId = parseInt(timestamp, 10);
    }

    async getRunId() {
        let date = new Date();
        let timestamp = date.getUTCDate().toString() + "_";
        timestamp += date.getUTCMonth().toString() + "_";
        timestamp += date.getUTCFullYear().toString() + "_";
        timestamp += date.getUTCHours().toString() + "_";
        timestamp += date.getUTCMinutes().toString() + "_";
        timestamp += date.getUTCSeconds().toString() + "_";
        timestamp += date.getUTCMilliseconds().toString();
        this.RunId = timestamp
    }

    async getTestRunId() {
        let str = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 3);
        let str1 = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 3);
        this.testRunID = str1 + this.numberRunId.toString() + str;
    }

    async createResultsFolder(scriptName) {
        this.ResultsPath = this.projectDirectory + "/Results";
        if (fs.existsSync(this.ResultsPath + "")) {
            this.logger.set("createResultsFolder", "Results Folder already exists");
        }
        else {
            fs.mkdirSync(this.ResultsPath + "");
            if (fs.existsSync(this.ResultsPath + "")) {
                this.logger.set("createResultsFolder", "Results Folder Folder Created");
            }
        }
        this.ResultsPath = this.ResultsPath + "/" + scriptName;
        if (fs.existsSync(this.ResultsPath + "")) {
            this.logger.set("createResultsFolder", "Script Results Folder already Exists");
        }
        else {
            fs.mkdirSync(this.ResultsPath + "");
            if (fs.existsSync(this.ResultsPath + "")) {
                this.logger.set("createResultsFolder", "Script Results Folder Exists");
            }
        }
        this.ResultsPath = this.ResultsPath + "/" + this.RunId;
        if (fs.existsSync(this.ResultsPath + "")) {
            this.logger.set("createResultsFolder", "Script Results Folder with Run ID already Exists");
        }
        else {
            fs.mkdirSync(this.ResultsPath + "");
            if (fs.existsSync(this.ResultsPath + "")) {
                this.logger.set("createResultsFolder", "Script Results Folder with Run ID Created");
            }
        }
    }

    async createLogFile() {
        if (fs.existsSync(this.ResultsPath + "/log.txt")) {
            this.logger.set("createLogFile", "Log file already exists");
        }
        else {
            fs.writeFileSync(this.ResultsPath + "/log.txt", "Log for test with RunId - " + this.RunId + "\n");

        }
        fs.appendFileSync(this.ResultsPath + "/log.txt", "Script Run ID - " + this.RunId + "\n");
        fs.appendFileSync(this.ResultsPath + "/log.txt", "Script Number Run ID - " + this.numberRunId + "\n");

        let frm = this;
        this.logger.forEach(function (value, key) {
            fs.appendFileSync(frm.ResultsPath + "/log.txt", key + " - " + value + "\n");
        })
    }

    async createScreenshotsFolder() {
        this.screenshotsFolderPath = this.ResultsPath + "/Screenshots";
        if (fs.existsSync(this.screenshotsFolderPath)) {
            this.logger.set("createScreenshotsFolder", "folder already exists");
            fs.appendFileSync(this.ResultsPath + "/log.txt", "createScreenshotsFolder" + " - " + "folder already exists" + "\n");
        }
        else {
            fs.mkdirSync(this.screenshotsFolderPath);
            if (fs.existsSync(this.screenshotsFolderPath)) {
                this.logger.set("createScreenshotsFolder", " Screenshots folder Created");
                fs.appendFileSync(this.ResultsPath + "/log.txt", "createScreenshotsFolder" + " - " + "Screenshots folder Created" + this.screenshotsFolderPath + "\n");
            }
        }
    }

    async createTestFolder(path) {
        if (fs.existsSync(path)) {
            this.log("createTestFolder - folder already exists");
            fs.appendFileSync(this.ResultsPath + "/log.txt", "createTestFolder" + " - " + path + " folder already exists" + "\n");
        }
        else {
            fs.mkdirSync(path);
            if (fs.existsSync(path)) {
                this.testsSreenshotsFolderPath = path;
                this.log("createTestFolder - Folder Created");
                fs.appendFileSync(this.ResultsPath + "/log.txt", "createTestFolder" + " - " + this.testsSreenshotsFolderPath + " folder Created" + "\n");
            }
        }
    }

    async takeScreenshot(screenshotname) {
        let error = null;
        let screenshotpath = this.testsSreenshotsFolderPath + "/" + screenshotname + ".png";
        await this.driver.takeScreenshot()
            .then(function (data) {
                fs.writeFileSync(screenshotpath, data, 'base64');
            })
            .catch(function (e) {
                error = e;
            });
        if (error != null) {
            this.logger.set("takeScreenshot", "screenshot method failed " + error);
        }
        return screenshotpath;
    }

    async sleep(timeinsec) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                this.log("Sleep for :" + timeinsec + " Seconds completed");
                resolve(0);
            }, timeinsec * 1000);
        });
    }

    async launchBrowser() {
        try {
            await this.log("Browser config :" + this.configProperties.get("Browser"))
            if (this.configProperties.get("Browser") == "chrome") {
                this.executionType = "local"
                this.driver = new Builder().forBrowser("chrome").build();
                await this.driver.manage().window().maximize();
                this.log("launchBrowser - Chrome Browser launched");
            }
            else if (this.configProperties.get("Browser") == "headlessfirefox") {
                this.executionType = "local"
                this.driver = new Builder().forBrowser("firefox")
                    .setFirefoxOptions(new firefox.Options().headless().windowSize({ width, height }))
                    .build();
                await this.driver.manage().window().maximize();
                this.log("launchBrowser - HeadlessFirefox Browser launched");
            }
            else if (this.configProperties.get("Browser") == "firefox") {
                this.executionType = "local"
                this.driver = new Builder().forBrowser("firefox").build();
                await this.driver.manage().window().maximize();
                this.log("launchBrowser - Firefox Browser launched");
            }
            else if (this.configProperties.get("Browser") == "headlesschrome") {
                this.executionType = "local"
                this.driver = new Builder().forBrowser("chrome")
                    .setChromeOptions(new chrome.Options().headless().windowSize({ width, height }))
                    .build();
                await this.driver.manage().window().maximize();
                this.log("launchBrowser - Headless Chrome Browser launched");
            }
            else if (this.configProperties.get("Browser") == "bs_chrome") {
                this.executionType = "browserstack"
                let caps = capabilities['chrome_Caps'];
                caps['bstack:options']['sessionName'] = this.mochatest.currentTest.fullTitle()
                const bs_local_args = { 'key': capabilities['access_key'], 'forceLocal': 'true' };
                let frm = this
                await new Promise((resolve, reject) => {
                    bs_local.start(bs_local_args, async function () {
                        console.log("Started BrowserStackLocal");
                        frm.driver = await new Builder()
                            .usingServer('http://' + capabilities['username'] + ':' + capabilities['access_key'] + '@hub-cloud.browserstack.com/wd/hub')
                            .withCapabilities({
                                ...caps,
                                ...(caps['browser'] && { browserName: caps['browser'] })
                            })
                            .build();
                        await frm.driver.manage().window().maximize();
                        resolve(0)
                    });
                });
                this.log("launchBrowser - Chrome Browser launched in Browserstack");
            }
            else if (this.configProperties.get("Browser") == "bs_firefox") {
                this.executionType = "browserstack"
                let caps = capabilities['firefox_Caps'];
                caps['bstack:options']['sessionName'] = this.mochatest.currentTest.fullTitle()
                const bs_local_args = { 'key': capabilities['access_key'], 'forceLocal': 'true' };
                let frm = this
                await new Promise((resolve, reject) => {
                    bs_local.start(bs_local_args, async function () {
                        console.log("Started BrowserStackLocal");
                        frm.driver = await new Builder()
                            .usingServer('http://' + capabilities['username'] + ':' + capabilities['access_key'] + '@hub-cloud.browserstack.com/wd/hub')
                            .withCapabilities({
                                ...caps,
                                ...(caps['browser'] && { browserName: caps['browser'] })
                            })
                            .build();
                        await frm.driver.manage().window().maximize();
                        resolve(0)
                    });
                });
                this.log("launchBrowser", "Firefox Browser launched in Browserstack");
            }
            else {
                throw new Error('Valid browser name not found to launch browser - ' + this.configProperties.get("Browser"));
            }
        }
        catch (e) {
            this.testStatus = false;
            throw new Error('Error occured while launching the browser' + e);
        }
    }
    async launchApplication(applicationurl, title = undefined) {
        try {
            await this.driver.get(applicationurl);
            await this.log("launchApplication Application launched");
            if (title !== undefined) {
                await this.verifyTitle(title);
            }
        } catch (e) {
            await this.logFailure('Issues while launching the Application', e);
            throw new Error(e);
        }
    }

    async closeBrowser() {
        await this.driver.quit();
        this.log("closeBrowser", "Browser closed successfully");
    }

    async performKeyboardAction(key) {
        if (key == 'DOWN')
            await this.driver.actions().sendKeys(KEY.DOWN).perform();
        else if (key == 'ENTER')
            await this.driver.actions().sendKeys(KEY.ENTER).perform();
        else if (key == 'TAB')
            await this.driver.actions().sendKeys(KEY.TAB).perform();
        else if (key == 'LEFT')
            await this.driver.actions().sendKeys(KEY.LEFT).perform();
        await this.log("performKeyboardAction - Action Performed " + key);
    }

    async checkTitle(title) {
        try {
            await driver.wait(until.titleIs(title), MAX_TIMEOUT);
            await this.log("checkTitleExists - Expected Title is present");
            return true;
        }
        catch (e) {
            await this.log("checkTitleExists - Expected Title is not present");
            return false;
        }
    }

    async verifyTitle(title) {
        if (!this.checkTitle(title)) {
            await this.getConsoleLogs();
            throw new Error("Expected title is not present - " + title)
        }
    }

    async verifyElementIsVisible(locator) {
        try {
            let element = await this.driver.wait(until.elementLocated(locator), MAX_TIMEOUT);
            await this.driver.wait(until.elementIsVisible(element), MAX_TIMEOUT);
            await this.log("verifyElementIsVisible: Element is identified and Visible - " + locator.toString());
        }
        catch (e) {
            if (e.name == "StaleElementReferenceError") {
                await this.log("verifyElementIsVisible: StaleElementReferenceError occured while waiting for element");
                return await this.verifyElementIsVisible(locator);
            } else {
                await this.log("verifyElementIsVisible: Element doesn't exist : " + locator.toString() + " - " + e);
                await this.getConsoleLogs();
                throw new Error("Unable to find Element: " + locator.toString() + " - " + e)
            }
        }
    }

    async checkVisibilityOfElement(element, timeout = undefined) {
        try {
            if (timeout == undefined)
                await this.driver.wait(until.elementIsVisible(element), MAX_TIMEOUT);
            else
                await this.driver.wait(until.elementIsVisible(element), timeout);

            await this.log("checkVisibilityOfElement: Element is Visible ");
            return true;
        }
        catch (e) {
            await this.log("checkVisibilityOfElement: Element is not visible " + e);
            return false;
        }
    }

    async getWebElement(locator, visibility = true) {
        try {
            let element = await this.driver.wait(until.elementLocated(locator), MAX_TIMEOUT);
            if (visibility)
                await this.driver.wait(until.elementIsVisible(element), MAX_TIMEOUT);
            await this.log("getWebElement: Element is identified and Visible - " + locator.toString());
            return element;
        }
        catch (e) {
            if (e.name == "StaleElementReferenceError") {
                await this.log("getWebElement: StaleElementReferenceError occured while waiting for element");
                return await this.getWebElement(locator);
            } else {
                await this.log("getWebElement: Element doesn't exist : " + locator.toString() + " - " + e);
                await this.getConsoleLogs();
                throw new Error("Unable to find Element: " + locator.toString() + " - " + e)
            }
        }
    }

    async checkElementExists(locator, visibility = true, timeout = MAX_TIMEOUT) {
        try {
            let element = await this.driver.wait(until.elementLocated(locator), timeout);
            if (visibility)
                await this.driver.wait(until.elementIsVisible(element), timeout);
            await this.log("checkElementExists: Element is identified and Visible - " + locator.toString());
            return true;
        }
        catch (e) {
            if (e.name == "StaleElementReferenceError") {
                await this.log("checkElementExists: StaleElementReferenceError occured while waiting for element");
                return await this.checkElementExists(locator, visibility, timeout);
            } else {
                await this.log("checkElementExists: Element doesn't exist : " + locator.toString() + " - " + e);
                return false;
            }
        }
    }

    async checkElementIsEnabled(locator, visibility = true, timeout = MAX_TIMEOUT) {
        try {
            let element = await this.driver.wait(until.elementLocated(locator), timeout);
            if (visibility)
                await this.driver.wait(until.elementIsVisible(element), timeout);
            await this.log("checkElementIsEnabled: Element is identified and Visible - " + locator.toString());
            return element.isEnabled();
        }
        catch (e) {
            if (e.name == "StaleElementReferenceError") {
                await this.log("checkElementIsEnabled: StaleElementReferenceError occured while waiting for element");
                return await this.checkElementIsEnabled(locator, visibility, timeout);
            } else {
                await this.log("checkElementIsEnabled: Element doesn't exist : " + locator.toString() + " - " + e);
                return false;
            }
        }
    }

    async updateCheckbox(locator, value = true, verify = true) {
        try {
            let element = await this.getWebElement(locator)
            let initialValue = await element.isSelected();
            await this.log("initial value " + initialValue)
            if (initialValue === value){
                await this.log("updateCheckbox: checkbox is already " + value + " for " + locator.toString());
                return;
            }
            else
                await element.click();
            if (verify) {
                element = await this.getWebElement(locator)
                let finalValue = await element.isSelected();
                await this.logSuccess("final value " + finalValue)
                if (finalValue === value)
                    await this.log("updateCheckbox: checkbox is set to " + value + " for " + locator.toString());
                else {
                    await this.getConsoleLogs();
                    throw new Error("Unable to update checkbox to " + value + " for element " + locator.toString())
                }
            }
        }
        catch (e) {
            if (e.name == "StaleElementReferenceError") {
                await this.log("checkWebElement: StaleElementReferenceError occured while updating checkbox");
                return await this.updateCheckbox(locator, value);
            } else {
                await this.getConsoleLogs();
                throw new Error("Unable to update checkbox to " + value + " for element " + locator.toString() + e)
            }
        }
    }

    async setValueByLocator(locator, value, clear = true, verify = true, afterAction = "TAB") {
        try {
            let element = await this.getWebElement(locator);
            if (clear) {
                await element.clear();
                await this.sleep(1);
                await this.log("Value is cleared: " + (await element.getAttribute('value')))
                if ((await element.getAttribute('value')) !== "") {
                    await element.clear();
                }
            }
            await element.sendKeys(value);
            if (afterAction != undefined)
                await this.performKeyboardAction(afterAction)
            if (verify) {
                if (value !== (await element.getAttribute('value'))) {
                    await this.logFailure("setValueByLocator " + value + " is set to element. " + locator.toString());
                    throw new Error("setValueByLocator " + value + " is set to element. " + locator.toString())
                }
            }
            await this.logSuccess("setValueByLocator " + value + " is set to element. " + locator.toString());
        } catch (e) {
            if (e.name == "StaleElementReferenceError") {
                await this.log("setValueByLocator + StaleElementReferenceError occured while setting value to element");
                await this.setValueByLocator(locator, value, clear, verify);
            } else {
                await this.logFailure("setValue + Set value failure: " + locator.toString() + " " + e);
                await this.getConsoleLogs();
                throw new Error("Error occured while setting value to Element by locator: " + locator.toString() + " - " + e)
            }
        }
    }

    async setValue(locator, value, clear = true, verify = true, afterAction = "TAB") {
        try {
            let element = await this.getWebElement(locator);
            if (clear) {
                await element.clear();
                await this.sleep(1);
                await this.log("Value is cleared: " + (await element.getAttribute('value')))
                if ((await element.getAttribute('value')) !== "") {
                    await element.clear();
                }
            }
            await element.sendKeys(value);
            await this.performKeyboardAction(afterAction)
        }catch (e) {
                if (e.name == "StaleElementReferenceError") {
                    await this.log("setValueByLocator + StaleElementReferenceError occured while setting value to element");
                    await this.setValueByLocator(locator, value, clear, verify);
                } else {
                    await this.logFailure("setValue + Set value failure: " + locator.toString() + " " + e);
                    await this.getConsoleLogs();
                    throw new Error("Error occured while setting value to Element by locator: " + locator.toString() + " - " + e)
                }
        
        }
    }



    async clickOnVisibleElement(locator) {
        try {
            let elements = await this.driver.findElements(locator);
            await this.logSuccess(elements.length)
            for (let i = 0; i < elements.length; i++) {
                if (await this.checkVisibilityOfElement(elements[i], 5000)) {
                    await elements[i].click();
                    await this.logSuccess("Performed clickOnVisibleElement " + locator.toString());
                    return;
                }
            }
        } catch (e) {
            if (e.name == "StaleElementReferenceError") {
                await this.log("clickOnVisibleElement + StaleElementReferenceError occured while clicking on element");
                await this.clickOnVisibleElement(locator);
            } else {
                await this.logFailure("clickOnVisibleElement Failed: " + locator.toString() + " " + e);
                await this.getConsoleLogs();
                throw new Error("Error occured while clicking on Element by locator: " + locator.toString() + " - " + e)
            }
        }
        await this.getConsoleLogs();
        throw new Error("Element is not visible to perform click: " + locator.toString())
    }

    async clickOnElement(locator) {
        try {
            let element = await this.getWebElement(locator);
            await this.driver.actions().scroll(0, 0, 0, 0, element).perform()
            await element.click();
            await this.logSuccess("Performed clickOnElement " + locator.toString());
        } catch (e) {
            if (e.name == "StaleElementReferenceError") {
                await this.log("clickOnElement - StaleElementReferenceError occured while clicking on element");
                await this.clickOnElement(locator);
            } if (e.name == "ElementClickInterceptedError") {
                await this.log("clickOnElement - ElementClickInterceptedError occured while clicking on element");
                await this.sleep(10)
                await this.logSuccess("clickOnElement - Resuming execution after 10 seconds");
                try {
                    element = await this.getVisibleElement(locator);
                    await this.driver.actions().scroll(0, 0, 0, 0, element).perform()
                    await element.click();
                    await this.logSuccess("Performed clickOnElement " + locator.toString());
                } catch {
                    if (e.name == "StaleElementReferenceError") {
                        await this.log("clickOnElement - StaleElementReferenceError occured while clicking on element");
                        await this.clickOnElement(locator);
                    }
                    else {
                        await this.logFailure("clickOnElement Failed: " + locator.toString() + " " + e);
                        await this.getConsoleLogs();
                        throw new Error("Error occured while clicking on Element by locator: " + locator.toString() + " - " + e)
                    }
                }
            } else {
                await this.logFailure("clickOnElement Failed: " + locator.toString() + " " + e);
                await this.getConsoleLogs();
                throw new Error("Error occured while clicking on Element by locator: " + locator.toString() + " - " + e)
            }
        }
    }

    async getVisibleElement(locator) {
        try {
            let elements = await this.driver.findElements(locator);
            await this.logSuccess(elements.length)
            for (let i = 0; i < elements.length; i++) {
                if (await this.checkVisibilityOfElement(elements[i], 5000)) {
                    await this.logSuccess("getVisibleElement - element is available and returned " + locator.toString());
                    return elements[i];
                }
            }
        } catch (e) {
            if (e.name == "StaleElementReferenceError") {
                await this.log("getVisibleElement + StaleElementReferenceError occured while checking visiblity of element");
                return await this.getVisibleElement(locator);
            } else {
                await this.logFailure("getVisibleElement Failed: " + locator.toString() + " " + e);
                await this.getConsoleLogs();
                throw new Error("Error occured  while checking visiblity of element by locator: " + locator.toString() + " - " + e)
            }
        }
        await this.getConsoleLogs();
        throw new Error("Element is not visible: " + locator.toString())
    }

    async hoverOnElement(locator) {
        try {
            let element = await this.getWebElement(locator);
            await this.driver.actions().move({ origin: element }).perform();
            await this.logSuccess("Performed hoverOnElement " + locator.toString());
        } catch (e) {
            if (e.name == "StaleElementReferenceError") {
                await this.log("hoverOnElement + StaleElementReferenceError occured while clicking on element");
                await this.hoverOnElement(locator);
            } else {
                await this.logFailure("hoverOnElement Failed: " + locator.toString() + " " + e);
                await this.getConsoleLogs();
                throw new Error("Error occured while performing mouse hover on Element by locator: " + locator.toString() + " - " + e)
            }
        }
    }

    async mouseLeftClickOnElement(locator) {
        try {
            let element = await this.getWebElement(locator);
            await this.driver.actions().move(element).click().perform();
            await this.logSuccess("Performed hoverOnElement " + locator.toString());
        } catch (e) {
            if (e.name == "StaleElementReferenceError") {
                await this.log("hoverOnElement + StaleElementReferenceError occured while clicking on element");
                await this.hoverOnElement(locator);
            } else {
                await this.logFailure("hoverOnElement Failed: " + locator.toString() + " " + e);
                await this.getConsoleLogs();
                throw new Error("Error occured while performing mouse hover on Element by locator: " + locator.toString() + " - " + e)
            }
        }
    }

    async selectValueByLocator(xpath_String, value) {
        try {
            await this.clickOnElement(By.xpath(xpath_String));
            await this.sleep(1);
            let element = await this.getWebElement(By.xpath(xpath_String + `/option[text()='${value}']`))
            await element.click();
            await this.logSuccess("selectValueByLocator " + value + " is set to element. " + xpath_String.toString());
        } catch (e) {
            if (e.name == "StaleElementReferenceError") {
                await this.log("selectValueByLocator + StaleElementReferenceError occured while setting value to element");
                await this.selectValueByLocator(xpath_String, value);
            } else {
                await this.logFailure("selectValueByLocator + Select value failure: " + xpath_String.toString() + " " + e);
                await this.getConsoleLogs();
                throw new Error("Error occured while setting value to Element by locator: " + xpath_String.toString() + " - " + e)
            }
        }
    }

    async getTextByLocator(locator) {
        let value = ""
        try {
            await this.driver.wait(until.elementLocated(locator), MAX_TIMEOUT);
            let element = await this.getVisibleElement(locator);
            value = await element.getText();
            await this.log("Value " + value + " is retrived from " + locator.toString());
            return value;
        } catch (e) {
            if (e.name == "StaleElementReferenceError") {
                await this.log("getTextByLocator + StaleElementReferenceError occured while clicking on element");
                return await this.getTextByLocator(locator);
            } else {
                await this.logFailure("getTextByLocator Failed: " + locator.toString() + " " + e);
                await this.getConsoleLogs();
                throw new Error("Error occured while clicking on Element by locator: " + locator.toString() + " - " + e)
            }
        }
    }

    async getTextByElement(element) {
        let value = ""
        try {
            value = await element.getText();
            await this.log("Value " + value + " is retrived from Element");
            return value;
        } catch (e) {
            if (e.name == "StaleElementReferenceError") {
                await this.log("getTextByLocator + StaleElementReferenceError occured while clicking on element");
                return await this.getTextByElement(element);
            } else {
                await this.logFailure("getTextByLocator Failed: " + " " + e);
                await this.getConsoleLogs();
                throw new Error("Error occured while clicking on Element by locator- " + e)
            }
        }
    }

    async webTable_GetColNum(locator, columnName) {
        await this.getWebElement(locator, false)
        let elements = await this.driver.findElements(locator);
        await this.log("webTable_GetColNum - " + elements.length + " elements found");
        for (let i = 0; i < elements.length; i++) {
            let text = await this.getTextByElement(elements[i]);
            await this.logSuccess("webTable_GetColNum - " + text + " is found in " + (i + 1) + " element");
            if (text == columnName) {
                return i + 1;
            }
        }
        return -1;
    }

    async waitForPageLoad()
    {
        if(await this.checkElementExists(By.xpath("//form[@id='contactForm']/table/tbody/tr[5]/td[2]/input"),true, 2)){
            return await this.waitForPageLoadOMW();
        }
        await this.logSuccess("Page Loading is completed")
    }

    getRandomnum(length = 9) {
        return faker.random.alphaNumeric(length);
    }

    getRandomStr(length = 9) {
        return faker.random.alpha({ count: length });
    }

    getRandomLPN() {
        return `TEST${this.getRandomnum(5)}`
    }

    getRandomVIN() {
        return this.getRandomnum(17);
    }

    getRandomspace() {
        return faker.random.number(1000);
    }

    getDate(date) {
        let days;
        let currDate = new Date();
        if (date === "SYSDATE") {
            return this.formatDateInMMDDYY(currDate, "/");
        }
        if (date.includes("SYSDATE")) {
            if (date.includes('+')) {
                days = parseInt(date.split('+')[1]);
                currDate.setDate(currDate.getDate() + days);
                return this.formatDateInMMDDYY(currDate, "/");
            } else if (date.includes('-')) {
                days = parseInt(date.split('-')[1]);
                currDate.setDate(currDate.getDate() - days);
                return this.formatDateInMMDDYY(currDate, "/");
            }
        }
        return date
    }

    getDate_MMDDYYYY(date) {
        let days;
        let currDate = new Date();
        if (date === "SYSDATE") {
            return this.formatDateInMMDDYYYY(currDate, "/");
        }
        if (date.includes("SYSDATE")) {
            if (date.includes('+')) {
                days = parseInt(date.split('+')[1]);
                currDate.setDate(currDate.getDate() + days);
                return this.formatDateInMMDDYYYY(currDate, "/");
            } else if (date.includes('-')) {
                days = parseInt(date.split('-')[1]);
                currDate.setDate(currDate.getDate() - days);
                return this.formatDateInMMDDYYYY(currDate, "/");
            }
        }
        return date
    }

    formatDateInMMDDYY(date, seperator) {
        let d = date;
        let month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear() % 100;

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [month, day, year].join(seperator);
    }

    formatDateInMMDDYYYY(date, seperator) {
        let d = date;
        let month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [month, day, year].join(seperator);
    }

}
module.exports = { ScriptHelper };
