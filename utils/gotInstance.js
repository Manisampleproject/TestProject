import _ from 'lodash';
import got from 'got';

const responseTimingLoggerHook = (response) => {
  if (process.env.DEBUG_API_REQUESTS !== 'true') {
    return response;
  }

  const {
    method,
    headers: { authorization },
  } = response.request.options;

  console.debug('Outgoing Request: ', {
    [method]: response.url,
    authorization: _.truncate(authorization, { length: 30 }) || 'no-auth',
    responseSize: response.rawBody.byteLength,
    responseTime: response.timings.phases.total,
  });
  console.table([response.timings.phases]);
  // console.log('Response Body:', response?.body);

  return response;
};

const responseJsonParserHook = (response) => {
  if (response && response.body) {
    try {
      return {
        ...response,
        data: JSON.parse(response.body),
        status: response.statusCode,
      };
    } catch (error) {
      // Log error and return original response if JSON parsing fails
      console.log(`Error parsing JSON response: ${error}`);
    }
  }
  return response;
};

const retryLoggerHook = (options, error, retryCount) => {
  console.log(`API call failed with error "${error.code}". Retrying (${retryCount})...`);
};

export const gotInstance = (isRetry = false) =>
  got.extend({
    retry: isRetry ? { limit: 3 } : { limit: 0 },
    backoff: {
      initialDelay: 1000, // wait 1 second before the first retry
      maxDelay: 5000, // wait no more than 5 seconds between retries
      randomize: true, // randomize the delay between retries to prevent overwhelming the server
    },
    hooks: {
      afterResponse: [responseTimingLoggerHook, responseJsonParserHook],
      beforeRetry: [retryLoggerHook],
    },
  });
