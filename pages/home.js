const { By } = require('selenium-webdriver');
const { ScriptHelper } = require('../resources/scriptHelper')

class Homelogin {
    helper = new ScriptHelper;
    xpath_Username_Textbox = By.xpath("//input[@name='username']");
    xpath_Password_Textbox = By.xpath("//input[@name='password']");
    xpath_Submit_Button = By.xpath("//input[@value='Log In']");
    xpath_LoggedInUserName_DropDown = By.xpath("//a[contains(@class, 'loggedInUserName')]")
    xpath_LogOutLink = By.xpath("//a[contains(@class, 'gwt-Anchor') and text() = 'Logout']")

    constructor(sc) {
        this.helper = sc;
    }

    async Login(username, password) {
        await this.helper.setValueByLocator(this.xpath_Username_Textbox, username)
        await this.helper.setValueByLocator(this.xpath_Password_Textbox, password, true, false)
        await this.helper.clickOnElement(this.xpath_Submit_Button)
        await this.helper.waitForPageLoadOMW()
    }

    async Logout() {
        await this.helper.clickOnElement(this.xpath_LoggedInUserName_DropDown)
        await this.helper.clickOnElement(this.xpath_LogOutLink)
        await this.helper.waitForPageLoadOMW()
        await this.helper.verifyElementIsVisible(this.xpath_Username_Textbox)
    }
}

module.exports = { Homelogin };