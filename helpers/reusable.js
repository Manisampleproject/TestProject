import constants from '../utils/constants';
import faker from 'faker';
import moment from 'moment';
import { gotInstance } from '../utils/gotInstance.js';
import { assert, expect, should, chai, chaiHttp } from './assertStyles.js';
import AWS from 'aws-sdk';
import crypto from 'crypto';
import { flattenParams } from '../utils/utils.js';



const getISODate = () => {
  var date = new Date();
  return date.toISOString().split(/['T'.]/)[1] + 'Z';
};
const getCurrentdate = () => {
  return moment().utc().format('YYYYMMDD');
};
const getformatteddate = () => {
  return moment().utc().format('YYYY-MM-DD');
};
const getformattedcustomdate = function (n) {
  return moment().add(n, 'days').format('YYYY-MM-DD');
};
const getformattedcustommonth = function (n) {
  return moment().add(n, 'months').format('YYYY-MM');
};
const getformattedcdate = function (n) {
  return moment().add(n, 'days').format('YYYYMMDD');
};
const getRandomUUID = () => {
  return crypto.randomUUID();
};
const getRandomText = () => {
  return faker.random.alphaNumeric(12);
};

const getRandomstr = (n) => {
  return faker.random.alphaNumeric(n);
};

const getRandomnum = (n) => {
  return faker.random.numeric(n)

};
export { getISODate };
export { getCurrentdate };
export { getformatteddate };
export { getformattedcustomdate };
export { getformattedcdate };
export { getRandomUUID };
export { getRandomText };
export { getRandomstr };
export { getRandomnum };