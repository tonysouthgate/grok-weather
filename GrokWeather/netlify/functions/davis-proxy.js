const crypto = require('crypto');

exports.handler = async (event, context) => {
  try {
    const API_KEY = 'bvgu5bfmm99lvfrqhlffy3l8pmpbq26v'; // Replace with process.env.API_KEY if using env vars
    const API_SECRET = 'lhcttqhmgxipv3zy8xgupadhbgowwcs1'; // Replace with process.env.API_SECRET
    const STATION_ID = '92193'; // Replace with process.env.STATION_ID

    // Generate timestamp
    const t = Math.floor(Date.now() / 1000);

    // Generate API signature
    const message = `api-key${API_KEY}station-id${STATION_ID}t${t}`;
    const hmac = crypto.createHmac('sha256', API_SECRET);
    hmac.update(message);
    const signature = hmac.digest('hex');

    // Construct Davis API URL
    const davisUrl = `https://api.weatherlink.com/v2/current/${STATION_ID}?api-key=${API_KEY}&api-signature=${signature}&t=${t}`;

    // Fetch Davis data
    const response = await fetch(davisUrl);
    if (!response.ok) {
      throw new Error(`Davis API request failed with status ${response.status}`);
    }
    const davisJson = await response.json();
    const sensors = davisJson.sensors;

    // Find outdoor sensor (with temp, hum, etc.)
    const outdoorSensor = sensors.find(s => s.data[0] && s.data[0].temp !== undefined && s.data[0].hum !== undefined);
    if (!outdoorSensor) {
      throw new Error('No outdoor sensor found in Davis data');
    }
    const oData = outdoorSensor.data[0];

    // Find pressure (may be in console or baro sensor)
    const barSensor = sensors.find(s => s.data[0] && s.data[0].bar_sea_level !== undefined);
    const pressure = barSensor ? barSensor.data[0].bar_sea_level * 33.8639 : null; // inHg to hPa

    // Process data with unit conversions
    const davisData = {
      temp: (oData.temp - 32) * 5 / 9, // °F to °C
      dew: (oData.dew_point - 32) * 5 / 9, // °F to °C
      pressure: pressure || 0, // Default to 0 if missing
      windSpeed: oData.wind_speed_last, // mph
      windDir: oData.wind_dir_last,
      humidity: oData.hum,
      rain: (oData.rainfall_last_24_hr_in || oData.rainfall_daily_in || 0) * 25.4, // inches to mm
      ts: oData.ts
    };

    return {
      statusCode: 200,
      body: JSON.stringify(davisData),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    console.error('Error in davis-proxy:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch Davis data' })
    };
  }
};
