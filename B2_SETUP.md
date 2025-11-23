# Backblaze B2 Setup Instructions

## You need to complete the B2 setup:

1. Go to: https://secure.backblaze.com/b2_buckets.htm

2. Click "Create a Bucket"

    - Bucket Name: familytree-photos (or your choice)
    - Files in Bucket: Public
    - Default Encryption: Disable
    - Object Lock: Disable

3. After creation, copy:

    - Bucket Name (e.g., "familytree-photos")
    - Bucket ID (starts with alphanumeric, e.g., "abc123def456")

4. Update .env.local with your values:
   B2_BUCKET_NAME=your-actual-bucket-name
   B2_BUCKET_ID=your-actual-bucket-id

5. Restart your dev server:
   npm run dev

## Your B2 credentials are already set:

-   Key ID: 220f3c48d311
-   Application Key: 005a74dddd466f9ca61c3cadedea4bb80be78b5952
-   Region: us-west-004

You ONLY need to create the bucket and update those 2 values!
