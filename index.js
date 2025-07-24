require('dotenv').config()
var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');

var {setBrowserService, getDriverConfig} = require('./helpers/driversServices.js');
var path = require('path');
var addToPath = require('add-to-path');

addToPath([__dirname + '\\drivers']);

var browser = process.env.MOCHA_BROWSER || 'chrome';

driver = getDriverConfig(browser);

exports.driver = driver;

exports.base_url = process.env.TEST_BASE_URL || 'https://parabank.parasoft.com/parabank/index.htm';