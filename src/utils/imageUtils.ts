import { uploadImage } from '@/lib/storage';

export async function convertBase64ToUrl(base64String: string): Promise<string | null> {
  try {
    if (!base64String) {
      return null;
    }



    // Upload to Hetzner server
    const result = await uploadImage(base64String, 'courses');
    
    return result.url;

  } catch (error) {
    console.error('Error converting base64 to URL:', error);
    return null;
  }
}
