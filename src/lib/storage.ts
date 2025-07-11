import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

type UploadResult = {
  url: string;
  key: string;
  bucket: string;
};

export async function uploadImage(
  base64Data: string,
  path: string
): Promise<UploadResult> {
  try {
    // Remove the data URL prefix if present
    const base64Image = base64Data.split(';base64,').pop();
    if (!base64Image) {
      throw new Error('Invalid base64 image data');
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Image, 'base64');
    
    // Generate a unique filename
    const fileExtension = base64Data.split(';')[0].split('/')[1];
    const key = `${path}.${fileExtension}`;
    const bucket = process.env.AWS_S3_BUCKET_NAME || 'skymirror-academy';

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: `image/${fileExtension}`,
      ACL: 'public-read',
    });

    await s3Client.send(command);

    // Generate the public URL
    const url = `https://${bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

    return {
      url,
      key,
      bucket,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
}

export async function getSignedUploadUrl(key: string, contentType: string) {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME || 'skymirror-academy',
      Key: key,
      ContentType: contentType,
      ACL: 'public-read',
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate signed URL');
  }
}

export function generateFileKey(folder: string, originalName: string): string {
  const extension = originalName.split('.').pop();
  const uniqueId = uuidv4();
  return `${folder}/${uniqueId}.${extension}`;
}
