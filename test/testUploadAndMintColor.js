import fs from 'fs';
import path from 'path';
import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

const s3 = new AWS.S3({
  endpoint: 'https://s3.filebase.com',
  region: 'us-east-1',
  accessKeyId: process.env.FILEBASE_KEY,
  secretAccessKey: process.env.FILEBASE_SECRET,
  s3ForcePathStyle: true,
});

// 上传文件到 Filebase 并返回 CID
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

// 上传 metadata.json
async function uploadMetadata(imageCID) {
  const metadata = {
    name: "FemColor NFT Demo",
    description: "NFT uploaded via Filebase",
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

// 主函数示例
(async () => {
  try {
    const imagePath = path.join('test', '7F7F7F.png');

    // 上传图片
    const imageCID = await uploadToFilebase(imagePath, 'images', 'image/png');
    const imageURL = `https://ipfs.filebase.io/ipfs/${imageCID}`;
    console.log('Image URL:', imageURL);

    // 上传 metadata
    const metadataCID = await uploadMetadata(imageCID);
    const metadataURL = `https://ipfs.filebase.io/ipfs/${metadataCID}`;
    console.log('Metadata URL:', metadataURL);

    console.log('All done! You can now use the metadata URL for minting NFT.');
  } catch (err) {
    console.error('Upload or mint failed:', err);
  }
})();
