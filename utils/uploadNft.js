// uploadNFT.js
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
require('dotenv').config();

// ===== Filebase S3 config =====
const s3 = new AWS.S3({
  endpoint: 'https://s3.filebase.com',
  region: 'us-east-1',
  accessKeyId: process.env.FILEBASE_KEY,
  secretAccessKey: process.env.FILEBASE_SECRET,
  s3ForcePathStyle: true,
});

// upload Filebase and return CID
async function uploadToFilebase(filePath, folder = 'images', contentType = 'image/png') {
  const fileName = path.basename(filePath);
  const fileStream = fs.createReadStream(filePath);
  const key = `${folder}/${Date.now()}_${fileName}`;

  const params = {
    Bucket: process.env.FILEBASE_BUCKET,
    Key: key,
    Body: fileStream,
    ContentType: contentType,
  };

  return new Promise((resolve, reject) => {
    const request = s3.putObject(params);
    request.on('httpHeaders', (statusCode, headers) => {
      const cid = headers['x-amz-meta-cid'];
      if (cid) {
        console.log(`${folder} uploaded successfully. CID:`, cid);
        resolve(cid);
      } else {
        reject(new Error('CID not found in response headers'));
      }
    });
    request.send((err) => {
      if (err) reject(err);
    });
  });
}

// upload metadata.json and return CID
async function uploadMetadata(imageCID, name = "FemColor NFT Demo", description = "NFT uploaded via Filebase") {
  const metadata = {
    name,
    description,
    image: `https://ipfs.filebase.io/ipfs/${imageCID}`,
    attributes: [
      { trait_type: "Category", value: "Test Upload" },
    ],
  };

  const tempPath = path.join('test', `metadata_${Date.now()}.json`);
  fs.writeFileSync(tempPath, JSON.stringify(metadata, null, 2));

  const metadataCID = await uploadToFilebase(tempPath, 'metadata', 'application/json');
  fs.unlinkSync(tempPath);

  return metadataCID;
}


module.exports = { uploadToFilebase, uploadMetadata };