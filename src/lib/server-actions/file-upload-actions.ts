'use server';

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';


async function saveFileToDisk(file: File, folder: string): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    const uniqueId = uuidv4();
    const filename = `${uniqueId}-${file.name.replace(/\s+/g, '-')}`;
    const uploadDir = join(process.cwd(), 'public', folder);
    
    await mkdir(uploadDir, { recursive: true });
    
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);
    
    return `/${folder}/${filename}`;
  } catch (error) {
    console.error("Disk Write Error:", error);
    throw new Error("Could not save file to disk");
  }
}


export async function uploadWorkspaceLogo(formData: FormData) {
  const file = formData.get('logo') as File;
  const workspaceId = formData.get('workspaceId') as string;

  if (!file || !workspaceId) {
    return { success: false, error: 'Missing file or workspace ID' };
  }

  if (!file.type.startsWith('image/')) {
    return { success: false, error: 'Only image files are allowed' };
  }

  if (file.size > 5 * 1024 * 1024) { 
    return { success: false, error: 'File size must be less than 5MB' };
  }

  try {
    const publicUrl = await saveFileToDisk(file, 'logos');
    
  
    return { success: true, url: publicUrl };
  } catch (error) {
    return { success: false, error: 'Upload failed' };
  }
}


export async function uploadUserAvatar(formData: FormData) {
  const file = formData.get('avatar') as File;
  const userId = formData.get('userId') as string;

  if (!file || !userId) return { success: false, error: 'Missing data' };

  try {
    const publicUrl = await saveFileToDisk(file, 'avatars');
    return { success: true, url: publicUrl };
  } catch (error) {
    return { success: false, error: 'Avatar upload failed' };
  }
}

export async function uploadBanner(formData: FormData) {
  const file = formData.get('banner') as File;
  const id = formData.get('id') as string;

  if (!file || !id) {
    return { success: false, error: 'Missing file or ID' };
  }

  if (!file.type.startsWith('image/')) {
    return { success: false, error: 'Only image files are allowed' };
  }

  if (file.size > 5 * 1024 * 1024) { 
    return { success: false, error: 'File size must be less than 5MB' };
  }

  try {
    const publicUrl = await saveFileToDisk(file, 'banners');
    return { success: true, url: publicUrl };
  } catch (error) {
    return { success: false, error: 'Banner upload failed' };
  }
}