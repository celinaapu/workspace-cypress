'use server';

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(file: File, folder: string): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: `workspace-cypress/${folder}`,
          public_id: `${Date.now()}-${file.name.replace(/\s+/g, '-')}`,
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(new Error('Upload failed'));
          } else if (result) {
            resolve(result.secure_url);
          } else {
            reject(new Error('Unknown upload error'));
          }
        }
      ).end(Buffer.from(buffer));
    });
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error('Could not upload file');
  }
}
