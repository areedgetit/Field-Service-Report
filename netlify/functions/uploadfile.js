exports.handler = async function (event, context) {
  console.log('Function started!');
  console.log('HTTP Method:', event.httpMethod);
  console.log('Headers:', JSON.stringify(event.headers));
  
  // Set headers with explicit CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling CORS preflight');
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    console.log('Processing request...');
    
    // Force a small delay to ensure logs are written
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const response = {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Function is working perfectly!',
        method: event.httpMethod,
        timestamp: new Date().toISOString(),
        hasBody: !!event.body,
        bodyLength: event.body ? event.body.length : 0,
        queryParams: event.queryStringParameters
      })
    };
    
    console.log('Returning response:', JSON.stringify(response, null, 2));
    return response;
    
  } catch (error) {
    console.error('Error in function:', error);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Function error',
        message: error.message,
        stack: error.stack
      })
    };
  }
};