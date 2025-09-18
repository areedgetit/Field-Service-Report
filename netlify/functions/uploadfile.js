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

  // Log the incoming request for debugging
  console.log('Request method:', event.httpMethod);
  console.log('Query parameters:', event.queryStringParameters);
  console.log('Headers:', event.headers);
  console.log('Body length:', event.body ? event.body.length : 'No body');
  console.log('Is base64 encoded:', event.isBase64Encoded);

  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const tenantId = process.env.TENANT_ID;
  const sharepointSiteUrl = process.env.SHAREPOINT_SITE_URL;
  const folderId = process.env.SHAREPOINT_FOLDER_ID;

  // Log environment variables (without exposing secrets)
  console.log('Environment check:');
  console.log('CLIENT_ID:', clientId ? 'Set' : 'Missing');
  console.log('CLIENT_SECRET:', clientSecret ? 'Set' : 'Missing');
  console.log('TENANT_ID:', tenantId ? 'Set' : 'Missing');
  console.log('SHAREPOINT_SITE_URL:', sharepointSiteUrl ? sharepointSiteUrl : 'Missing');
  console.log('SHAREPOINT_FOLDER_ID:', folderId ? 'Set' : 'Missing');

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
    console.log('Requesting access token...');
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
          error: 'Token parsing failed',
          details: tokenRaw
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
          error: tokenData.error_description || tokenData.error || 'Authentication failed',
          details: tokenData
        }),
      };
    }

    const accessToken = tokenData.access_token;
    console.log('Access token obtained successfully');

    // STEP 2: Prepare File
    let fileContent;
    
    try {
      if (event.isBase64Encoded) {
        console.log('Processing base64 encoded body');
        fileContent = Buffer.from(event.body, 'base64');
      } else {
        console.log('Processing binary body');
        // For Netlify functions, binary data comes as base64 string even when not marked as such
        fileContent = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');
      }
      
      console.log('File content prepared, buffer length:', fileContent.length);
    } catch (error) {
      console.error('Error preparing file content:', error);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: 'Error processing file content',
          error: error.message
        })
      };
    }

    const fileName = event.queryStringParameters?.fileName || 'uploadedFile.pdf';
    console.log('File name:', fileName);

    // STEP 3: Upload to SharePoint
    // Try different URL formats based on your SharePoint setup
    const uploadUrl = `https://graph.microsoft.com/v1.0/sites/${sharepointSiteUrl}/drives/${folderId}/root:/${fileName}:/content`;
    console.log('Upload URL:', uploadUrl);

    console.log('Uploading to SharePoint...');
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/pdf',
        'Content-Length': fileContent.length.toString()
      },
      body: fileContent,
    });

    const uploadText = await uploadResponse.text();
    console.log('Upload response status:', uploadResponse.status);
    console.log('Upload response headers:', uploadResponse.headers.raw());

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

      // Provide more specific error messages based on status code
      let errorMessage = 'Upload failed';
      switch (uploadResponse.status) {
        case 401:
          errorMessage = 'Authentication failed - check your credentials';
          break;
        case 403:
          errorMessage = 'Access forbidden - check SharePoint permissions';
          break;
        case 404:
          errorMessage = 'SharePoint site or folder not found';
          break;
        case 409:
          errorMessage = 'File already exists or conflict';
          break;
        default:
          errorMessage = `SharePoint upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`;
      }

      return {
        statusCode: uploadResponse.status,
        headers,
        body: JSON.stringify({
          message: errorMessage,
          error: uploadResult.error || uploadResult.rawResponse || 'Unknown error',
          status: uploadResponse.status,
          details: uploadResult
        }),
      };
    }

    console.log('File uploaded successfully to SharePoint');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'File uploaded successfully',
        fileName: fileName,
        data: uploadResult,
      }),
    };

  } catch (error) {
    console.error('Unexpected error during file upload:', error);
    console.error('Error stack:', error.stack);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'Unexpected server error',
        error: error.message,
        type: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
    };
  }
};