const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const maxCoverImageBytes = Number(process.env.MAX_COVER_IMAGE_BYTES || DEFAULT_MAX_IMAGE_BYTES);
const uploadDirectory = path.join(__dirname, '..', '..', 'uploads', 'covers');

const mimeExtensionMap = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const parseDataImageUrl = (value) => {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/i.exec(value);
  if (!match) {
    return null;
  }

  return {
    mimeType: String(match[1]).toLowerCase(),
    base64Payload: String(match[2]).replace(/\s/g, ''),
  };
};

const persistCoverImage = async (coverImageUrl, req) => {
  if (coverImageUrl === undefined) {
    return undefined;
  }

  if (coverImageUrl === null) {
    return null;
  }

  const normalizedValue = String(coverImageUrl).trim();
  if (!normalizedValue) {
    return null;
  }

  const parsedDataImage = parseDataImageUrl(normalizedValue);
  if (!parsedDataImage) {
    return normalizedValue;
  }

  const extension = mimeExtensionMap[parsedDataImage.mimeType];
  if (!extension) {
    throw { status: 400, message: 'Unsupported image format. Use JPG, PNG, WEBP, or GIF.' };
  }

  const imageBuffer = Buffer.from(parsedDataImage.base64Payload, 'base64');
  if (!imageBuffer.length) {
    throw { status: 400, message: 'Invalid cover image data' };
  }

  if (imageBuffer.length > maxCoverImageBytes) {
    throw {
      status: 400,
      message: `Cover image must be smaller than ${Math.floor(maxCoverImageBytes / (1024 * 1024))} MB`,
    };
  }

  await fs.mkdir(uploadDirectory, { recursive: true });

  const fileName = `cover-${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${extension}`;
  const filePath = path.join(uploadDirectory, fileName);
  await fs.writeFile(filePath, imageBuffer);

  const publicPath = `/uploads/covers/${fileName}`;

  return publicPath;
};

module.exports = {
  persistCoverImage,
};
