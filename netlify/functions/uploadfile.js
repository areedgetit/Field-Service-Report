exports.handler = async function (event, context) {
  console.log('Function started!');
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    console.log('Inside try block');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Function is working!',
        method: event.httpMethod,
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error('Error in function:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Function error',
        message: error.message
      })
    };
  }
};