exports.handler = async function (event, context) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  try {
    console.log('=== FUNCTION START ===');
    console.log('HTTP Method:', event.httpMethod);
    
    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
      console.log('Handling OPTIONS request');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'CORS preflight' })
      };
    }

    // Check environment variables first
    console.log('Checking environment variables...');
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const tenantId = process.env.TENANT_ID;
    const sharepointSiteUrl = process.env.SHAREPOINT_SITE_URL;
    const folderId = process.env.SHAREPOINT_FOLDER_ID;

    console.log('CLIENT_ID:', clientId ? 'SET' : 'MISSING');
    console.log('CLIENT_SECRET:', clientSecret ? 'SET' : 'MISSING');
    console.log('TENANT_ID:', tenantId ? 'SET' : 'MISSING');
    console.log('SHAREPOINT_SITE_URL:', sharepointSiteUrl || 'MISSING');
    console.log('SHAREPOINT_FOLDER_ID:', folderId ? 'SET' : 'MISSING');

    if (!clientId || !clientSecret || !tenantId || !sharepointSiteUrl || !folderId) {
      console.error('Missing environment variables');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Missing required environment variables',
          missing: {
            clientId: !clientId,
            clientSecret: !clientSecret,
            tenantId: !tenantId,
            sharepointSiteUrl: !sharepointSiteUrl,
            folderId: !folderId
          }
        })
      };
    }

    console.log('Environment variables OK');

    // Check if we have a body
    if (!event.body) {
      console.error('No request body provided');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'No file data provided'
        })
      };
    }

    console.log('Request body length:', event.body.length);
    console.log('Is base64 encoded:', event.isBase64Encoded);

    // Get the filename
    const fileName = event.queryStringParameters?.fileName || 'uploadedFile.pdf';
    console.log('Target filename:', fileName);

    // STEP 1: Get Access Token
    console.log('=== GETTING ACCESS TOKEN ===');
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    console.log('Token URL:', tokenUrl);

    const tokenResponse = await fetch(tokenUrl, {
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
    });

    console.log('Token response status:', tokenResponse.status);
    const tokenText = await tokenResponse.text();
    console.log('Token response (first 100 chars):', tokenText.substring(0, 100));

    let tokenData;
    try {
      tokenData = JSON.parse(tokenText);
    } catch (err) {
      console.error('Failed to parse token response');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Failed to parse Microsoft token response',
          response: tokenText
        })
      };
    }

    if (!tokenResponse.ok) {
      console.error('Token request failed:', tokenData);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Microsoft authentication failed',
          details: tokenData
        })
      };
    }

    if (!tokenData.access_token) {
      console.error('No access token in response');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'No access token received',
          response: tokenData
        })
      };
    }

    console.log('Access token obtained successfully');
    const accessToken = tokenData.access_token;

    // STEP 2: Prepare file content
    console.log('=== PREPARING FILE CONTENT ===');
    let fileContent;
    
    try {
      if (event.isBase64Encoded) {
        fileContent = Buffer.from(event.body, 'base64');
      } else {
        // For binary data in Netlify functions, it often comes as base64 even when not marked
        fileContent = Buffer.from(event.body, 'base64');
      }
      console.log('File buffer created, length:', fileContent.length);
    } catch (error) {
      console.error('Error creating file buffer:', error.message);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Failed to process file data',
          details: error.message
        })
      };
    }

    // STEP 3: Upload to SharePoint
    console.log('=== UPLOADING TO SHAREPOINT ===');
    const uploadUrl = `https://graph.microsoft.com/v1.0/sites/${sharepointSiteUrl}/drives/${folderId}/root:/${fileName}:/content`;
    console.log('Upload URL:', uploadUrl);

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/pdf',
      },
      body: fileContent,
    });

    console.log('Upload response status:', uploadResponse.status);
    const uploadText = await uploadResponse.text();
    console.log('Upload response (first 200 chars):', uploadText.substring(0, 200));

    let uploadResult;
    try {
      uploadResult = JSON.parse(uploadText);
    } catch {
      uploadResult = { rawResponse: uploadText };
    }

    if (!uploadResponse.ok) {
      console.error('Upload failed with status:', uploadResponse.status);
      return {
        statusCode: uploadResponse.status,
        headers,
        body: JSON.stringify({
          error: 'SharePoint upload failed',
          status: uploadResponse.status,
          details: uploadResult
        })
      };
    }

    console.log('=== UPLOAD SUCCESSFUL ===');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'File uploaded successfully',
        fileName: fileName,
        data: uploadResult
      })
    };

  } catch (error) {
    console.error('=== UNEXPECTED ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Unexpected server error',
        message: error.message,
        name: error.name,
        stack: error.stack
      })
    };
  }
};