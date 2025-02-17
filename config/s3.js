const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const deleteFile = async (fileUrl) => {
    try {
        if (!fileUrl) return;

        // Extract the key from the S3 URL
        const key = fileUrl.split('/').slice(3).join('/');
        
        // Delete the file from S3
        await s3Client.send(new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key
        }));
        return true;
    } catch (error) {
        console.error('Failed to delete file from S3:', error);
        return false;
    }
};

module.exports = {
    s3Client,
    deleteFile
};
