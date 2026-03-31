/* eslint-env node */
const { google } = require('googleapis')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

function verifyToken(event) {
  const auth = event.headers['authorization'] || ''
  const match = auth.match(/^Bearer\s+([a-f0-9]{64})$/i)
  return !!match
}

function getSheets() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return google.sheets({ version: 'v4', auth })
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (!verifyToken(event)) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized' }),
    }
  }

  try {
    const { action, range, values } = JSON.parse(event.body || '{}')
    const sheets = getSheets()
    const spreadsheetId = process.env.VITE_SPREADSHEET_ID

    if (action === 'read') {
      const res = await sheets.spreadsheets.values.get({ spreadsheetId, range })
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ values: res.data.values || [] }),
      }
    }

    if (action === 'append') {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [values] },
      })
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) }
    }

    if (action === 'update') {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [values] },
      })
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) }
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: `Unknown action: ${action}` }),
    }
  } catch (err) {
    console.error(err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
