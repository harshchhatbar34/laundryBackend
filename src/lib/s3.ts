import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

/**
 * Uploads a base64 encoded file or data URI to S3.
 * If the upload fails, it ignores the error and returns a placeholder URL.
 * 
 * @param base64Data The base64 string or data URI (e.g. data:image/jpeg;base64,...)
 * @param folder The folder name in the S3 bucket
 * @returns The public URL of the uploaded file
 */
export const uploadBase64ToS3 = async (base64Data: string, folder = 'documents'): Promise<string> => {
  try {
    if (!base64Data) return '';

    // Check if it's a data URI and extract mime type and base64 string
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    
    let buffer: Buffer;
    let contentType = 'application/octet-stream';
    let extension = '';

    if (matches && matches.length === 3) {
      contentType = matches[1];
      buffer = Buffer.from(matches[2], 'base64');
      extension = contentType.split('/')[1] || '';
      if (extension === 'jpeg') extension = 'jpg';
    } else {
      // Assume raw base64 if no data URI prefix
      buffer = Buffer.from(base64Data, 'base64');
    }

    const fileName = `${folder}/${uuidv4()}${extension ? `.${extension}` : ''}`;
    const bucketName = process.env.AWS_S3_BUCKET_NAME || 'laundry-bucket';

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: contentType,
      // ACL: 'public-read', // Ensure bucket policies allow this if needed
    });

    await s3Client.send(command);

    return `https://${bucketName}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${fileName}`;
  } catch (error) {
    console.error('S3 Upload Error, falling back to placeholder URL:', error);
    // Ignore error and return a placeholder URL as requested
    return 'https://via.placeholder.com/150';
  }
};
