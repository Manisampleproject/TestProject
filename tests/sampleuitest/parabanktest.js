
const ScriptHelper = require('../../resources/scriptHelper.js').ScriptHelper
var test = require('selenium-webdriver/testing');
const login = require('../../pages/home.js').Homelogin
const about = require('../../pages/aboutus.js').aboutus
const contact = require('../../pages/contact.js').contact
const sc = new ScriptHelper();
const LOGIN = new login(sc);
const ABOUT = new about(sc);
const CONTACT = new contact(sc);
const data = require('../../resources/TestData/tdata.js')
var { By, until } = require('selenium-webdriver');
var expect = require('chai').expect;
var { getDriverConfig } = require('../../resources/ConfigProperties.js');

var browser = 'chrome';

var driver = getDriverConfig(browser);

let tags = require('mocha-tags');
let testData =
[

{
    "loginDetails": {
        "url": data.LOGIN_URL,
        "username": data.userid,
        "password": data.password
    }
}
]
tags("smoke", "regression", "crossbrowsertest").
    describe('Login and validate', async function () {
        this.timeout(1200);
        before(async function () {
            return driver.get(testData.loginDetails.url);

        })

        after(async function () {
            driver.takeScreenshot().then(function (data) {
                utils.writeScreenshot(data, 'screenshot');
                driver.close();
            })


            afterEach(async function () {
                var title = this.currentTest.title.replace(new RegExp(' |/', 'g'), '-');
                var screenshotName = 'screenshot-' + title;
                if (this.currentTest.state === 'failed') {
                    driver.takeScreenshot().then(function (data) {
                        writeScreenshot(data, screenshotName);
                    });
                };
            })

            for (const data of testData) {
                let loginDetails = {};

                it("Login to the page - ", async function () {
                    

                    await LOGIN.Login(data.loginDetails.username, (data.loginDetails.password));

                })

                 it("Login to verify about us - ", async function () {
                    
                    await LOGIN.Login(data.loginDetails.username, (data.loginDetails.password));
                    await ABOUT.clickOnaboutUs();

                })

                  it("Login to verify Name required error on Contact form - ", async function () {
                    
                    await LOGIN.Login(data.loginDetails.username, (data.loginDetails.password));
                    await CONTACT.contactoption();

                })

            }
        })

    })


