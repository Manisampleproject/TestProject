const { By } = require('selenium-webdriver');
const { ScriptHelper } = require('../resources/scriptHelper')
const tstdata = require('../resources/TestData/tdata')
let assert = require('chai').assert;

class contact {
    helper = new ScriptHelper;
    xpath_contact_menubutton = By.xpath("//a[contains(text(),'contact')]");
    xpath_aboutusTitle = By.xpath("//a[contains(text(),'About Us')]");
    xpath_contact_title = By.xpath("//div[@id='rightPanel']/h1");
    xpath_submitform_button = By.xpath("//form[@id='contactForm']/table/tbody/tr[5]/td[2]/input");
    xpath_name_requiredText = By.xpath("//div[@id='rightPanel']/h1")
    constructor(sc) {
        this.helper = sc;
    }

    async contactoption() {
        await this.helper.clickOnElement(this.xpath_contact_menubutton)
        await this.helper.waitForPageLoad()
        await this.helper.checkElementExists(this.xpath_contact_title)
        await this.helper.clickOnElement(this.xpath_submitform_button)
        await this.helper.checkElementExists(this.xpath_name_requiredText)

    }

}

module.exports = { contact };