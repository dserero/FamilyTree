import B2 from "backblaze-b2";

let b2Instance: B2 | null = null;
let authCache: { token: string; expiresAt: number; uploadUrl: string; authToken: string } | null = null;

// Initialize and authorize B2 client
async function getAuthorizedB2() {
    const keyId = process.env.B2_KEY_ID?.trim();
    const appKey = process.env.B2_APPLICATION_KEY?.trim();

    if (!keyId || !appKey) {
        throw new Error("B2 credentials not configured");
    }

    // Create B2 instance if it doesn't exist
    if (!b2Instance) {
        b2Instance = new B2({
            applicationKeyId: keyId,
            applicationKey: appKey,
        });
    }

    // Authorize if not already authorized or token expired
    if (!authCache || Date.now() > authCache.expiresAt) {
        console.log("Authorizing B2...");
        const authResponse = await b2Instance.authorize();
        authCache = {
            token: authResponse.data.authorizationToken,
            expiresAt: Date.now() + 23 * 60 * 60 * 1000, // 23 hours
            uploadUrl: "",
            authToken: authResponse.data.authorizationToken,
        };
        console.log("B2 authorized successfully");
    }

    return { b2: b2Instance, auth: authCache };
}

export async function uploadPhotoToB2(file: Buffer, fileName: string, contentType: string): Promise<string> {
    const bucketName = process.env.B2_BUCKET_NAME;
    const bucketId = process.env.B2_BUCKET_ID;

    if (!bucketName || !bucketId) {
        throw new Error("B2_BUCKET_NAME or B2_BUCKET_ID is not configured");
    }

    // Generate UUID-based filename to avoid spaces and special characters
    const fileExtension = fileName.split(".").pop() || "jpg";
    const uuid = crypto.randomUUID();
    const uniqueFileName = `photos/${uuid}.${fileExtension}`;

    try {
        const { b2 } = await getAuthorizedB2();

        console.log("Getting upload URL for bucket:", bucketId);

        // Get upload URL for the bucket
        const uploadUrlResponse = await b2.getUploadUrl({ bucketId });
        const { uploadUrl, authorizationToken } = uploadUrlResponse.data;

        console.log("Uploading file to B2:", uniqueFileName);

        // Upload the file
        const uploadResponse = await b2.uploadFile({
            uploadUrl,
            uploadAuthToken: authorizationToken,
            fileName: uniqueFileName,
            data: file,
            mime: contentType,
        });

        console.log("Successfully uploaded to B2:", uploadResponse.data.fileName);

        // Get the download URL from B2 - this is the proper way for public buckets
        const { b2: b2Auth } = await getAuthorizedB2();
        const downloadAuth = await b2Auth.getDownloadAuthorization({
            bucketId: bucketId,
            fileNamePrefix: uniqueFileName,
            validDurationInSeconds: 604800, // 7 days
        });

        // Use the proper B2 download URL format
        // The authResponse contains the download URL base
        const authResponse = await b2Auth.authorize();
        const downloadUrl = authResponse.data.downloadUrl;
        const publicUrl = `${downloadUrl}/file/${bucketName}/${uniqueFileName}`;

        console.log("Generated public URL:", publicUrl);
        return publicUrl;
    } catch (error: any) {
        console.error("B2 Upload Error:", {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
        });
        throw error;
    }
}

export async function deletePhotoFromB2(fileName: string, fileId: string): Promise<void> {
    try {
        const { b2 } = await getAuthorizedB2();

        await b2.deleteFileVersion({
            fileId,
            fileName,
        });

        console.log("Successfully deleted from B2:", fileName);
    } catch (error: any) {
        console.error("B2 Delete Error:", {
            message: error.message,
            response: error.response?.data,
        });
        throw error;
    }
}

// Extract file key from URL for deletion
export function extractFileKeyFromUrl(url: string): string {
    const match = url.match(/file\/[^/]+\/(.+)$/);
    return match ? match[1] : "";
}

// Get a proper download URL for a file (useful for private buckets or verification)
export async function getDownloadUrl(fileName: string): Promise<string> {
    const bucketName = process.env.B2_BUCKET_NAME;
    const bucketId = process.env.B2_BUCKET_ID;

    if (!bucketName || !bucketId) {
        throw new Error("B2_BUCKET_NAME or B2_BUCKET_ID is not configured");
    }

    try {
        const { b2 } = await getAuthorizedB2();

        // Get file info to verify it exists
        const fileResponse = await b2.listFileNames({
            bucketId,
            maxFileCount: 1,
            prefix: fileName,
            startFileName: "",
            delimiter: "",
        });

        if (fileResponse.data.files.length === 0) {
            throw new Error(`File not found: ${fileName}`);
        }

        const file = fileResponse.data.files[0];

        // For public buckets, use the friendly URL format
        // Encode the filename properly
        const encodedFileName = fileName
            .split("/")
            .map((part) => encodeURIComponent(part))
            .join("/");
        const downloadUrl = `https://f${bucketId}.backblazeb2.com/file/${bucketName}/${encodedFileName}`;

        return downloadUrl;
    } catch (error: any) {
        console.error("Error getting download URL:", {
            message: error.message,
            response: error.response?.data,
        });
        throw error;
    }
}
