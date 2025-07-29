import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

// Define response types
interface HetznerUploadResponse {
  url: string;
  path: string;
}

interface HetznerSignedUrlResponse {
  signedUrl: string;
  path: string;
}

// Hetzner server configuration
const HETZNER_API_URL = process.env.HETZNER_API_URL || 'https://api.hetzner.example.com';
const HETZNER_API_KEY = process.env.HETZNER_API_KEY;

// Define response interfaces
interface UploadResponse {
  url: string;
  path: string;
}

interface SignedUrlResponse {
  signedUrl: string;
  path: string;
}

interface HetznerUploadResponse {
  url: string;
  path: string;
  [key: string]: unknown;
}

interface HetznerSignedUrlResponse {
  signedUrl: string;
  path: string;
  [key: string]: unknown;
}

type UploadResult = {
  url: string;
  path: string;
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

    // Generate a unique filename
    const fileExtension = base64Data.split(';')[0].split('/')[1];
    const filename = `${uuidv4()}.${fileExtension}`;
    const uploadPath = `${path}/${filename}`;

    // Upload to Hetzner server
    const response = await axios.post<HetznerUploadResponse>(
      `${HETZNER_API_URL}/upload`,
      {
        file: base64Image,
        path: uploadPath,
        contentType: `image/${fileExtension}`
      },
      {
        headers: {
          'Authorization': `Bearer ${HETZNER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Get the URL from the response
    const url = response.data.url;

    return {
      url,
      path: uploadPath,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
}

export async function getSignedUploadUrl(path: string, contentType: string) {
  try {
    // Generate a unique filename
    const fileExtension = contentType.split('/')[1];
    const filename = `${uuidv4()}.${fileExtension}`;
    const uploadPath = `${path}/${filename}`;

    // Get signed URL from Hetzner server
    const response = await axios.post<HetznerSignedUrlResponse>(
      `${HETZNER_API_URL}/signed-url`,
      {
        path: uploadPath,
        contentType: contentType,
        expires: Math.floor(Date.now() / 1000) + 3600
      },
      {
        headers: {
          'Authorization': `Bearer ${HETZNER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data.signedUrl) {
      throw new Error('No signed URL returned from server');
    }

    return response.data.signedUrl;
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
