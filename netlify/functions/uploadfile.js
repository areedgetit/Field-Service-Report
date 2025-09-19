async function uploadToSharePoint(fileName, fileBuffer, driveId, accessToken) {
  try {
    const uploadUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${fileName}:/content`;

    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/pdf", // adjust if not always pdf
      },
      body: fileBuffer,
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`SharePoint upload failed: ${response.status} ${response.statusText} - ${errorDetails}`);
    }

    const result = await response.json();
    console.log("✅ File uploaded successfully:", result);
    return result;
  } catch (error) {
    console.error("❌ Upload error:", error.message);
    throw error;
  }
}
