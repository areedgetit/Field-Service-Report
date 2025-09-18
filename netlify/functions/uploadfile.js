exports.handler = async function (event, context) {
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const tenantId = process.env.TENANT_ID;
  const sharepointSiteUrl = process.env.SHAREPOINT_SITE_URL;
  const folderId = process.env.SHAREPOINT_FOLDER_ID;

  try {
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
    let tokenData;

    try {
      tokenData = JSON.parse(tokenRaw);
    } catch (err) {
      console.error('Failed to parse token response:', tokenRaw);
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: 'Invalid token response from Microsoft',
          raw: tokenRaw,
        }),
      };
    }

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Token request failed:', tokenData);
      return {
        statusCode: tokenResponse.status,
        body: JSON.stringify({
          message: 'Failed to obtain access token',
          response: tokenData,
        }),
      };
    }

    const accessToken = tokenData.access_token;

    // STEP 2: Prepare File
    const isBase64Encoded = event.isBase64Encoded;
    const fileContent = isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : event.body;

    const fileName = event.queryStringParameters?.fileName || 'uploadedFile.pdf';
    const uploadUrl = `https://graph.microsoft.com/v1.0/sites/${sharepointSiteUrl}/drives/${folderId}/root:/Documents/${fileName}:/content`;

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
    let uploadResult;

    try {
      uploadResult = JSON.parse(uploadText);
    } catch {
      uploadResult = uploadText;
    }

    if (!uploadResponse.ok) {
      console.error('Upload failed:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        body: uploadResult,
      });

      return {
        statusCode: uploadResponse.status,
        body: JSON.stringify({
          message: 'Upload failed',
          status: uploadResponse.status,
          response: uploadResult,
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'File uploaded successfully',
        data: uploadResult,
      }),
    };
  } catch (error) {
    console.error('Error during file upload:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Unexpected server error',
        error: error.message,
      }),
    };
  }
};
