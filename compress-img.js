import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.join(__dirname, 'src', 'assets', 'main.jpg');
const outputPath = path.join(__dirname, 'src', 'assets', 'main.webp');

sharp(inputPath)
  .resize(800)
  .webp({ quality: 80 })
  .toFile(outputPath)
  .then(() => {
    console.log('Image compressed to WebP successfully!');
  })
  .catch((err) => {
    console.error('Error compressing image:', err);
  });
