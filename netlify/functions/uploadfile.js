exports.handler = async function (event, context) {
  console.log('=== FUNCTION START ===');
  console.log('HTTP Method:', event.httpMethod);
  console.log('Path:', event.path);
  console.log('Query params:', JSON.stringify(event.queryStringParameters));
  console.log('Headers:', JSON.stringify(event.headers, null, 2));
  console.log('Body length:', event.body ? event.body.length : 'No body');
  console.log('Is base64 encoded:', event.isBase64Encoded);
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  try {
    // Handle OPTIONS preflight
    if (event.httpMethod === 'OPTIONS') {
      console.log('Handling CORS preflight request');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'CORS preflight handled' })
      };
    }

    // Handle GET requests (for direct browser testing)
    if (event.httpMethod === 'GET') {
      console.log('Handling GET request');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          message: 'Function is working via GET!',
          timestamp: new Date().toISOString() 
        })
      };
    }

    // Handle POST requests
    if (event.httpMethod === 'POST') {
      console.log('Handling POST request');
      
      const fileName = event.queryStringParameters?.fileName || 'test-file.pdf';
      console.log('Target filename:', fileName);
      
      let bodyInfo = 'No body';
      if (event.body) {
        bodyInfo = `Body length: ${event.body.length}, First 50 chars: ${event.body.substring(0, 50)}`;
      }
      console.log('Body info:', bodyInfo);
      
      // Just return success for now - don't actually upload to SharePoint
      const response = {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'POST request received successfully!',
          fileName: fileName,
          bodyReceived: !!event.body,
          bodyLength: event.body ? event.body.length : 0,
          contentType: event.headers['content-type'] || 'Not specified',
          timestamp: new Date().toISOString()
        })
      };
      
      console.log('Returning successful POST response');
      return response;
    }

    // Handle other methods
    console.log('Unsupported method:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        error: 'Method not allowed',
        method: event.httpMethod 
      })
    };

  } catch (error) {
    console.error('=== FUNCTION ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Function error',
        message: error.message,
        name: error.name
      })
    };
  }
};