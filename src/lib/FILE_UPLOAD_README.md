# Enhanced File Upload System

This document describes the enhanced file upload system that combines file system operations with database updates to ensure consistency between stored files and their database references.

## Overview

The `uploadFileAndUpdateDatabase` function performs both file system write and database update operations in a single transaction-like operation, ensuring that the URL in your database actually matches a file that exists.

## Key Features

1. **Atomic Operations**: File upload and database update happen together
2. **Database Connection Management**: Automatic connection checking and establishment
3. **Document Serialization**: Proper handling of MongoDB documents for Next.js Server Actions
4. **Type Safety**: Full TypeScript support with proper field validation
5. **Error Handling**: Comprehensive error handling with meaningful messages
6. **Flexible Entity Support**: Supports User, Workspace, Folder, and File entities

## Implementation Checklist for MongoDB

### ✅ Database Connection Helper
The system includes `ensureDatabaseConnection()` which checks `mongoose.connections[0].readyState` before performing operations.

### ✅ Model Support
All Mongoose schemas have the proper String fields:
- **User**: `avatar_url`
- **Workspace**: `logo`, `bannerUrl`
- **Folder**: `bannerUrl`
- **File**: `bannerUrl`

### ✅ Serialization
MongoDB documents are properly serialized using `JSON.parse(JSON.stringify(doc))` before returning to clients.

## API Reference

### uploadFileAndUpdateDatabase

```typescript
async function uploadFileAndUpdateDatabase(
  file: File,
  options: {
    entityType: 'user' | 'workspace' | 'folder' | 'file';
    entityId: string;
    field: 'avatar_url' | 'logo' | 'bannerUrl';
    folder?: string;
  }
): Promise<{
  success: boolean;
  url?: string;
  error?: string;
  data?: any;
}>
```

#### Parameters

- **file**: The File object to upload
- **options.entityType**: The type of entity to update ('user', 'workspace', 'folder', 'file')
- **options.entityId**: The MongoDB ObjectId of the entity
- **options.field**: The field to update in the database
- **options.folder**: Optional folder name for file organization (defaults to 'uploads')

#### Returns

- **success**: Boolean indicating if the operation succeeded
- **url**: The public URL of the uploaded file (if successful)
- **error**: Error message (if failed)
- **data**: The serialized updated document (if successful)

## Usage Examples

### Server Action Example

```typescript
'use server';

import { uploadFileAndUpdateDatabase } from '@/lib/file-upload';

export async function updateWorkspaceLogo(formData: FormData) {
  const file = formData.get('logo') as File;
  const workspaceId = formData.get('workspaceId') as string;

  if (!file || !workspaceId) {
    return { success: false, error: 'Missing file or workspace ID' };
  }

  return await uploadFileAndUpdateDatabase(file, {
    entityType: 'workspace',
    entityId: workspaceId,
    field: 'logo',
    folder: 'logos'
  });
}
```

### Client Component Example

```typescript
'use client';

import { useState } from 'react';
import { updateWorkspaceLogo } from './server-actions';

export function LogoUpload({ workspaceId }: { workspaceId: string }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('logo', file);
    formData.append('workspaceId', workspaceId);

    try {
      const result = await updateWorkspaceLogo(formData);
      if (result.success) {
        console.log('Logo updated:', result.url);
        // Update UI state or redirect
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <input
      type="file"
      accept="image/*"
      onChange={handleUpload}
      disabled={uploading}
    />
  );
}
```

## Production Considerations

### File System Limitations

While saving to the public folder works perfectly for local development, keep in mind:

- **VPS Hosting** (DigitalOcean, AWS EC2): The `fs` approach works fine
- **Serverless Platforms** (Vercel/Netlify): Files will disappear on redeploy

### Recommended Cloud Solutions for Production

For serverless platforms, consider replacing the `fs` logic with:

1. **Cloudinary**: Excellent for image optimization and transformations
2. **AWS S3**: Scalable object storage with CDN capabilities
3. **UploadThing**: Next.js-optimized file upload service

### Migration Path

To migrate to cloud storage, you only need to modify the `uploadFile` function in `file-upload.ts`. The `uploadFileAndUpdateDatabase` function will work with any upload method that returns a URL.

## Error Handling

The system provides comprehensive error handling:

1. **File System Errors**: Directory creation, file writing failures
2. **Database Errors**: Connection issues, invalid IDs, validation failures
3. **Validation Errors**: Invalid entity type/field combinations
4. **Network Errors**: Timeout or connection issues

All errors are caught and returned in a consistent format for easy client-side handling.

## Security Considerations

1. **File Type Validation**: Add file type validation on the client and server
2. **File Size Limits**: Implement appropriate file size restrictions
3. **Authentication**: Ensure only authorized users can upload files
4. **Rate Limiting**: Consider rate limiting upload endpoints

## Performance Optimization

1. **Image Compression**: Consider compressing images before upload
2. **Lazy Loading**: Use lazy loading for uploaded images in the UI
3. **CDN**: Serve uploaded files through a CDN in production
4. **Caching**: Implement appropriate caching strategies for uploaded files
