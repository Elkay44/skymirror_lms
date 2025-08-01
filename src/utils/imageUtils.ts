import { NextResponse } from 'next/server';
import { uploadImage } from '@/lib/storage';

export async function convertBase64ToUrl(base64String: string): Promise<string | null> {
  try {
    if (!base64String) {
      return null;
    }

    // Extract the MIME type from the base64 string
    const base64Data = base64String.split(';base64,').pop() || '';
    const mimeType = base64String.split(';')[0].split(':')[1];

    // Upload to Hetzner server
    const result = await uploadImage(base64String, 'courses');
    
    return result.url;

  } catch (error) {
    console.error('Error converting base64 to URL:', error);
    return null;
  }
}
