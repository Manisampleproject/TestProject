const { By } = require('selenium-webdriver');
const { ScriptHelper } = require('../resources/scriptHelper')
const tstdata = require('../resources/TestData/tdata')
let assert = require('chai').assert;

class aboutus {
    helper = new ScriptHelper;
    xpath_aboutus_SubMenu = By.xpath("//a[contains(text(),'About Us')]");
    xpath_aboutusTitle = By.xpath("//a[contains(text(),'About Us')]");
   
    constructor(sc) {
        this.helper = sc;
    }

    async clickOnaboutUs() {
        await this.helper.clickOnElement(this.xpath_aboutus_SubMenu)
        await this.helper.hoverOnElement(this.xpath_aboutusTitle)
       await this.helper.checkElementExists(this.xpath_aboutusTitle)
        
    }

}

module.exports = { aboutus };