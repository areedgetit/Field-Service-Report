const fetch = require('node-fetch'); // You might need to install 'node-fetch' for serverless functions

exports.handler = async function(event, context) {
  // Get environment variables
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const tenantId = process.env.TENANT_ID;
  const sharepointSiteUrl = process.env.SHAREPOINT_SITE_URL;
  const folderId = process.env.SHAREPOINT_FOLDER_ID;

  try {
    // Get Access Token from Microsoft Identity Platform (OAuth 2.0)
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
        scope: 'https://graph.microsoft.com/.default'
      })
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Now that we have the access token, we can use Microsoft Graph API to upload the file
    const fileContent = event.body; // Assuming the file is sent as raw data
    const fileName = event.queryStringParameters.fileName || 'uploadedFile.pdf'; // Default file name

    // Upload to SharePoint (replace with your specific Graph API endpoint)
    const uploadResponse = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${sharepointSiteUrl}/drives/${folderId}/root:/Documents/${fileName}:/content`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/pdf'
        },
        body: fileContent
      }
    );

    const uploadResult = await uploadResponse.json();
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'File uploaded successfully', data: uploadResult })
    };
  } catch (error) {
    console.error('Error during file upload:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error uploading file', error: error.message })
    };
  }
};
