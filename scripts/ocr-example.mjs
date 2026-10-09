import sharp from 'sharp';
import fs from 'node:fs/promises';
await fs.mkdir('public/assets/ocr', {recursive:true});
const lines = ['ImgHub OCR', '图片文字识别，无需选择语言。', '繁體中文也可以直接識別。', '日本語の文字を読み取ります。', 'English text: GPU runs on your device.', 'Order 2026-1003 / Total: 128.50'];
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="980" height="540"><rect width="980" height="540" fill="#fffdf8"/><rect x="32" y="32" width="916" height="476" rx="8" fill="#fff" stroke="#d5cbbb"/>${lines.map((line,i)=>`<text x="65" y="${105+i*70}" font-family="Microsoft YaHei, Yu Gothic, Arial, sans-serif" font-size="${i===0?40:30}" fill="#2c251e">${line}</text>`).join('')}</svg>`;
await sharp(Buffer.from(svg)).webp({lossless:true}).toFile('public/assets/ocr/example.webp');
console.log('Created original multilingual OCR sample.');
