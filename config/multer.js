const multer = require('multer');
const multerS3 = require('multer-s3');
const s3Client = require('./s3');

const upload = multer({
    storage: multerS3({
        s3: s3Client,
        bucket: process.env.AWS_S3_BUCKET,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            // remove spaces from original filename, replace with dashes
            const filename = file.originalname.replace(/\s+/g, '-').toLowerCase();
            cb(null, `${Date.now()}-${filename}`);
        }
    })
});

module.exports = upload;
