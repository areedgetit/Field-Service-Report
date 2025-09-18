exports.handler = async function (event, context) {
  console.log('=== FUNCTION START ===');
  console.log('HTTP Method:', event.httpMethod);
  console.log('Content-Type:', event.headers['content-type']);
  console.log('Body length:', event.body ? event.body.length : 'No body');
  console.log('Is base64 encoded:', event.isBase64Encoded);
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  try {
    if (event.httpMethod === 'OPTIONS') {
      console.log('Handling CORS preflight request');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'CORS preflight handled' })
      };
    }

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

    if (event.httpMethod === 'POST') {
      console.log('=== HANDLING POST REQUEST ===');

      const clientId = process.env.CLIENT_ID;
      const clientSecret = process.env.CLIENT_SECRET;
      const tenantId = process.env.TENANT_ID;
      const sharepointSiteUrl = process.env.SHAREPOINT_SITE_URL;
      let folderId = process.env.SHAREPOINT_FOLDER_ID; // we may overwrite after fetching drives

      console.log('Environment check:');
      console.log('CLIENT_ID:', clientId ? 'SET' : 'MISSING');
      console.log('CLIENT_SECRET:', clientSecret ? 'SET' : 'MISSING');
      console.log('TENANT_ID:', tenantId ? 'SET' : 'MISSING');
      console.log('SHAREPOINT_SITE_URL:', sharepointSiteUrl || 'MISSING');
      console.log('SHAREPOINT_FOLDER_ID:', folderId ? 'SET' : 'MISSING');

      if (!clientId || !clientSecret || !tenantId || !sharepointSiteUrl) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Missing required environment variables' })
        };
      }

      const fileName = event.queryStringParameters?.fileName || 'uploadedFile.pdf';
      console.log('Target filename:', fileName);

      if (!event.body) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'No file data provided' })
        };
      }

      console.log('Processing file content...');
      let fileContent;
      try {
        fileContent = Buffer.from(event.body, 'base64');
        console.log('File buffer created, length:', fileContent.length);
      } catch (error) {
        console.error('Error processing file:', error.message);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Failed to process file data', details: error.message })
        };
      }

      console.log('=== GETTING ACCESS TOKEN ===');
      const tokenResponse = await fetch(
        `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials',
            scope: 'https://graph.microsoft.com/.default',
          }),
        }
      );

      const tokenData = await tokenResponse.json();
      console.log('Token request status:', tokenResponse.status);

      if (!tokenResponse.ok || !tokenData.access_token) {
        console.error('Token request failed:', tokenData);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Authentication failed', details: tokenData })
        };
      }

      console.log('Access token obtained');

      // ==== NEW: FETCH DRIVE ID ====
      try {
        console.log('Fetching drives for site...');
        const drivesResponse = await fetch(
          `https://graph.microsoft.com/v1.0/sites/${sharepointSiteUrl}/drives`,
          { headers: { 'Authorization': `Bearer ${tokenData.access_token}` } }
        );
        const drivesData = await drivesResponse.json();
        console.log('Drives fetch status:', drivesResponse.status);
        console.log('Drives data:', JSON.stringify(drivesData, null, 2));

        const documentsDrive = drivesData.value?.find(d => d.name === 'Documents');
        if (documentsDrive) {
          folderId = documentsDrive.id;
          console.log('Documents drive ID:', folderId);
        } else {
          console.warn('Documents drive not found, using folderId from env:', folderId);
        }
      } catch (err) {
        console.error('Error fetching drives:', err);
      }
      // ==== END FETCH DRIVE ID ====

      console.log('=== UPLOADING TO SHAREPOINT ===');
      const uploadUrl = `https://graph.microsoft.com/v1.0/sites/${sharepointSiteUrl}/drives/${folderId}/root:/${fileName}:/content`;
      console.log('Upload URL:', uploadUrl);

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/pdf',
        },
        body: fileContent,
      });

      console.log('Upload response status:', uploadResponse.status);
      const uploadText = await uploadResponse.text();
      let uploadResult;
      try { uploadResult = JSON.parse(uploadText); } 
      catch { uploadResult = { rawResponse: uploadText }; }

      if (!uploadResponse.ok) {
        console.error('Upload failed:', uploadResponse.status, uploadResult);
        return {
          statusCode: uploadResponse.status,
          headers,
          body: JSON.stringify({ error: 'SharePoint upload failed', status: uploadResponse.status, details: uploadResult })
        };
      }

      console.log('=== UPLOAD SUCCESSFUL ===');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'File uploaded successfully', fileName, data: uploadResult })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed', method: event.httpMethod })
    };

  } catch (error) {
    console.error('=== FUNCTION ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Unexpected server error', message: error.message })
    };
  }
};
