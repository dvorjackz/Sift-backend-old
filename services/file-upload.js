const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const config = require('../config');
 
aws.config.update({
    secretAccessKey: config.aws.secretAcessKey,
    accessKeyId: config.aws.accessKeyId,
    region: 'us-west-1'
});

const s3 = new aws.S3();
 
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'dsp-winter-2020-resumes',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      cb(null, file.originalname);
    }
  })
});
 
module.exports = upload;