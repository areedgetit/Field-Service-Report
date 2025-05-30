exports.handler = async function (event, context) {
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const tenantId = process.env.TENANT_ID;
  const sharepointSiteUrl = process.env.SHAREPOINT_SITE_URL;
  const folderId = process.env.SHAREPOINT_FOLDER_ID;

  try {
    // Get Access Token from Microsoft Identity Platform (OAuth 2.0)
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

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const isBase64Encoded = event.isBase64Encoded;
    const fileContent = isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : event.body;

    const fileName = event.queryStringParameters?.fileName || 'uploadedFile.pdf';

    const uploadUrl = `https://graph.microsoft.com/v1.0/sites/${sharepointSiteUrl}/drives/${folderId}/root:/Documents/${fileName}:/content`;

    console.log('Uploading to:', uploadUrl);
    console.log('Access token starts with:', accessToken?.substring(0, 20));

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
        message: 'Error uploading file',
        error: error.message,
      }),
    };
  }
};
