exports.handler = async function (event, context) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const tenantId = process.env.TENANT_ID;
  const sharepointSiteUrl = process.env.SHAREPOINT_SITE_URL;
  const folderId = process.env.SHAREPOINT_FOLDER_ID;

  // Validate environment variables
  if (!clientId || !clientSecret || !tenantId || !sharepointSiteUrl || !folderId) {
    console.error('Missing required environment variables');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'Server configuration error',
        error: 'Missing required environment variables'
      }),
    };
  }

  try {
    console.log('Starting file upload process...');

    // STEP 1: Get Access Token
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'client_credentials',
          scope: 'https://graph.microsoft.com/.default',
        }),
      }
    );

    const tokenRaw = await tokenResponse.text();
    console.log('Token response status:', tokenResponse.status);

    let tokenData;
    try {
      tokenData = JSON.parse(tokenRaw);
    } catch (err) {
      console.error('Failed to parse token response:', tokenRaw);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          message: 'Invalid token response from Microsoft',
          error: 'Token parsing failed'
        }),
      };
    }

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Token request failed:', tokenData);
      return {
        statusCode: tokenResponse.status,
        headers,
        body: JSON.stringify({
          message: 'Failed to obtain access token',
          error: tokenData.error || 'Authentication failed'
        }),
      };
    }

    const accessToken = tokenData.access_token;

    // STEP 2: Prepare File - Fix body processing
    let fileContent;
    
    if (event.isBase64Encoded) {
      fileContent = Buffer.from(event.body, 'base64');
    } else if (typeof event.body === 'string') {
      // If body is a string, convert to buffer
      fileContent = Buffer.from(event.body, 'binary');
    } else {
      // If body is already a buffer
      fileContent = event.body;
    }

    const fileName = event.queryStringParameters?.fileName || 'uploadedFile.pdf';
    console.log('Uploading file:', fileName, 'Size:', fileContent.length);

    // Fix the SharePoint URL - use the correct endpoint
    const uploadUrl = `https://graph.microsoft.com/v1.0/sites/${sharepointSiteUrl}/drives/${folderId}/root:/${fileName}:/content`;

    // STEP 3: Upload File
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/pdf',
      },
      body: fileContent,
    });

    const uploadText = await uploadResponse.text();
    console.log('Upload response status:', uploadResponse.status);

    let uploadResult;
    try {
      uploadResult = JSON.parse(uploadText);
    } catch {
      uploadResult = { rawResponse: uploadText };
    }

    if (!uploadResponse.ok) {
      console.error('Upload failed:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        body: uploadResult,
      });

      return {
        statusCode: uploadResponse.status,
        headers,
        body: JSON.stringify({
          message: 'Upload failed',
          error: `SharePoint upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`,
          details: uploadResult
        }),
      };
    }

    console.log('File uploaded successfully');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'File uploaded successfully',
        data: uploadResult,
      }),
    };

  } catch (error) {
    console.error('Error during file upload:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'Unexpected server error',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
    };
  }
};