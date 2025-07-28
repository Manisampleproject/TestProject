import { gotInstance } from '../utils/gotInstance.js';
import tdata from '../resources/TestData/tdata.js'


const auth0token = async credentials => {

  const formData = {
    grant_type: 'client_credentials',
    audience: 'public.api.xyz.com',
    ...credentials,
  };
  try {
    const authResponse = await axios.post('https://auth.dev.io/oauth/token', formData);
    return authResponse;
  } catch (error) {
    console.log(error.message);
  }

};

const setTokens = async () => {
  try {
    tokens = await getTempSession('arn:aws:iam::xxxxx:role/test-qa', 'temp-session');
  } catch (error) {
    console.log(error);
  }


const stringifyNums = (context, events, done) => {
  context.vars.id = context.vars.id.toString();
  return done();
}


module.exports = {

  stringifyNums,
  setTokens,
  auth0token
}