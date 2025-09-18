// Save this as netlify/functions/hello.js
exports.handler = async (event, context) => {
  console.log('Hello function called');
  console.log('Method:', event.httpMethod);
  console.log('Query params:', event.queryStringParameters);
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Hello from Netlify function!',
      timestamp: new Date().toISOString(),
      method: event.httpMethod
    })
  };
};