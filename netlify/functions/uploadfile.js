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
    // Handle OPTIONS preflight
    if (event.httpMethod === 'OPTIONS') {
      console.log('Handling CORS preflight request');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'CORS preflight handled' })
      };
    }

    // Handle GET requests
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

    // Handle POST requests - Full SharePoint upload
    if (event.httpMethod === 'POST') {
      console.log('=== HANDLING POST REQUEST ===');
      
      // Check environment variables
      const clientId = process.env.CLIENT_ID;
      const clientSecret = process.env.CLIENT_SECRET;
      const tenantId = process.env.TENANT_ID;
      const sharepointSiteUrl = process.env.SHAREPOINT_SITE_URL;
      const folderId = process.env.SHAREPOINT_FOLDER_ID;

      console.log('Environment check:');
      console.log('CLIENT_ID:', clientId ? 'SET' : 'MISSING');
      console.log('CLIENT_SECRET:', clientSecret ? 'SET' : 'MISSING');
      console.log('TENANT_ID:', tenantId ? 'SET' : 'MISSING');
      console.log('SHAREPOINT_SITE_URL:', sharepointSiteUrl || 'MISSING');
      console.log('SHAREPOINT_FOLDER_ID:', folderId ? 'SET' : 'MISSING');

      if (!clientId || !clientSecret || !tenantId || !sharepointSiteUrl || !folderId) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Missing required environment variables'
          })
        };
      }

      // Get filename
      const fileName = event.queryStringParameters?.fileName || 'uploadedFile.pdf';
      console.log('Target filename:', fileName);

      // Check if we have body data
      if (!event.body) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'No file data provided'
          })
        };
      }

      // Process file content
      console.log('Processing file content...');
      let fileContent;
      try {
        if (event.isBase64Encoded) {
          fileContent = Buffer.from(event.body, 'base64');
        } else {
          // For binary data, Netlify often sends as base64 even when not marked
          fileContent = Buffer.from(event.body, 'base64');
        }
        console.log('File buffer created, length:', fileContent.length);
      } catch (error) {
        console.error('Error processing file:', error.message);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Failed to process file data',
            details: error.message
          })
        };
      }

      // Get access token
      console.log('=== GETTING ACCESS TOKEN ===');
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
      console.log('Token request status:', tokenResponse.status);

      if (!tokenResponse.ok || !tokenData.access_token) {
        console.error('Token request failed:', tokenData);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Authentication failed',
            details: tokenData
          })
        };
      }

      console.log('Access token obtained');

      // TOKEN INSPECTION - Check what permissions are actually in the token
      console.log('=== TOKEN INSPECTION ===');
      try {
        // Decode the token payload (it's base64 encoded JWT)
        const tokenParts = tokenData.access_token.split('.');
        if (tokenParts.length >= 2) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          console.log('Token app ID:', payload.appid || payload.azp || 'Not found');
          console.log('Token audience:', payload.aud || 'Not found');
          console.log('Token roles/permissions:', payload.roles || 'No roles found');
          console.log('Token scopes:', payload.scp || 'No scopes found');
          console.log('Token issuer:', payload.iss || 'Not found');
          console.log('Token expires:', new Date((payload.exp || 0) * 1000).toISOString());
          
          // Check if Sites permissions are present
          if (payload.roles && payload.roles.includes('Sites.ReadWrite.All')) {
            console.log('✅ Sites.ReadWrite.All permission found in token!');
          } else if (payload.roles && payload.roles.includes('Sites.Read.All')) {
            console.log('⚠️  Only Sites.Read.All found - need Sites.ReadWrite.All');
          } else {
            console.log('❌ NO Sites permissions found in token!');
            console.log('Available roles:', payload.roles);
          }
        } else {
          console.log('❌ Could not parse token structure');
        }
      } catch (e) {
        console.log('❌ Could not decode token:', e.message);
      }
      console.log('=== END TOKEN INSPECTION ===');

      // TEST 1: SUPER BASIC - Try to get service root (requires minimal permissions)
      console.log('=== TESTING SERVICE ROOT ACCESS ===');
      try {
        const serviceRootResponse = await fetch(
          'https://graph.microsoft.com/v1.0/',
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${tokenData.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('Service root test status:', serviceRootResponse.status);
        const serviceRootData = await serviceRootResponse.json();
        console.log('Service root response:', JSON.stringify(serviceRootData, null, 2));
        
        if (serviceRootResponse.ok) {
          console.log('✅ Service root access successful!');
        } else {
          console.log('❌ Service root access failed:', serviceRootData);
        }
      } catch (error) {
        console.log('Service root test error:', error.message);
      }

      // TEST 2: Try to list sites (requires Sites permissions)
      console.log('=== TESTING BASIC SITES ACCESS ===');
      try {
        const testResponse = await fetch(
          'https://graph.microsoft.com/v1.0/sites',
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${tokenData.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('Basic sites access test status:', testResponse.status);
        const testData = await testResponse.json();
        console.log('Basic sites access test response:', JSON.stringify(testData, null, 2));
        
        if (testResponse.ok) {
          console.log('✅ Basic sites access successful!');
          console.log('Number of sites found:', testData.value ? testData.value.length : 'Unknown');
        } else {
          console.log('❌ Basic sites access failed:', testData);
          // Don't return error - continue with other tests
        }
      } catch (error) {
        console.log('Basic sites access test error:', error.message);
        // Don't return error - continue with other tests
      }

      // TEST 3: Try to get site by host name (alternative method)
      console.log('=== TESTING SITE BY HOSTNAME ===');
      try {
        const hostnameResponse = await fetch(
          'https://graph.microsoft.com/v1.0/sites/steelhead365.sharepoint.com',
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${tokenData.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('Site by hostname test status:', hostnameResponse.status);
        const hostnameData = await hostnameResponse.json();
        console.log('Site by hostname response:', JSON.stringify(hostnameData, null, 2));
        
        if (hostnameResponse.ok) {
          console.log('✅ Site by hostname successful!');
          console.log('Root site name:', hostnameData.displayName);
        } else {
          console.log('❌ Site by hostname failed:', hostnameData);
        }
      } catch (error) {
        console.log('Site by hostname test error:', error.message);
      }

      // TEST SPECIFIC SITE ACCESS
      console.log('=== TESTING SPECIFIC SITE ACCESS ===');
      try {
        const testResponse = await fetch(
          `https://graph.microsoft.com/v1.0/sites/${sharepointSiteUrl}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${tokenData.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('Specific site access test status:', testResponse.status);
        const testData = await testResponse.json();
        console.log('Specific site access test response:', JSON.stringify(testData, null, 2));
        
        if (testResponse.ok) {
          console.log('✅ Specific site access successful!');
          console.log('Site name:', testData.displayName);
          console.log('Site ID:', testData.id);
        } else {
          console.log('❌ Specific site access failed:', testData);
          // Don't return here - continue to drive test
        }
      } catch (error) {
        console.log('Specific site access test error:', error.message);
        // Don't return here - continue to drive test
      }

      // TEST DRIVE ACCESS
      console.log('=== TESTING DRIVE ACCESS ===');
      try {
        const driveResponse = await fetch(
          `https://graph.microsoft.com/v1.0/sites/${sharepointSiteUrl}/drive`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${tokenData.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('Drive access test status:', driveResponse.status);
        const driveData = await driveResponse.json();
        console.log('Drive access test response:', JSON.stringify(driveData, null, 2));
        
        if (driveResponse.ok) {
          console.log('✅ Drive access successful!');
          console.log('Drive name:', driveData.name);
          console.log('Drive ID:', driveData.id);
        } else {
          console.log('❌ Drive access failed:', driveData);
          return {
            statusCode: driveResponse.status,
            headers,
            body: JSON.stringify({
              error: 'Drive access test failed - check permissions',
              status: driveResponse.status,
              details: driveData
            })
          };
        }
      } catch (error) {
        console.log('Drive access test error:', error.message);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Drive access test failed with exception',
            details: error.message
          })
        };
      }

      console.log('=== END ACCESS TESTS ===');

      // Upload to SharePoint
      console.log('=== UPLOADING TO SHAREPOINT ===');
      //const uploadUrl = `https://graph.microsoft.com/v1.0/sites/${sharepointSiteUrl}/drives/${folderId}/root:/${fileName}:/content`;
      const uploadUrl = `https://graph.microsoft.com/v1.0/sites/${sharepointSiteUrl}/drive/items/root:/Documents/${fileName}:/content`;
      console.log('Upload URL:', uploadUrl);

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/octet-stream',
        },
        body: fileContent,
      });

      console.log('Upload response status:', uploadResponse.status);
      const uploadText = await uploadResponse.text();

      let uploadResult;
      try {
        uploadResult = JSON.parse(uploadText);
      } catch {
        uploadResult = { rawResponse: uploadText };
      }

      if (!uploadResponse.ok) {
        console.error('Upload failed:', uploadResponse.status, uploadResult);
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
    }

    // Handle other methods
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        error: 'Method not allowed',
        method: event.httpMethod 
      })
    };

  } catch (error) {
    console.error('=== FUNCTION ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Unexpected server error',
        message: error.message
      })
    };
  }
};