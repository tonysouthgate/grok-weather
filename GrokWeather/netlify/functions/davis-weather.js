// netlify/functions/davis-weather.js

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const API_KEY = 'bvgu5bfmm99lvfrqhlffy3l8pmpbq26v';
    const API_SECRET = 'lhcttqhmgxipv3zy8xgupadhbgowwcs1';
    const STATION_ID = '92193';

    const apiUrl = `https://api.weatherlink.com/v2/current/${STATION_ID}?api-key=${API_KEY}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-Api-Secret': API_SECRET,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`WeatherLink API Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Davis API Error:', error);

    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString()
      }),
    };
  }
};
