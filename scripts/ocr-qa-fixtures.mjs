import sharp from 'sharp';
import fs from 'node:fs/promises';
await fs.mkdir('output/ocr', {recursive:true});
const lines=Array.from({length:40},(_,i)=>`第${String(i+1).padStart(2,'0')}行：图片识别测试 Reading ${String(i+1).padStart(2,'0')}`);
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="3600"><rect width="600" height="3600" fill="white"/>${lines.map((text,i)=>`<text x="32" y="${45+i*89}" font-family="Microsoft YaHei, Arial, sans-serif" font-size="16" fill="#222">${text}</text>`).join('')}</svg>`;
await sharp(Buffer.from(svg)).webp({lossless:true}).toFile('output/ocr/long-small-text.webp');
await sharp({create:{width:300,height:200,channels:3,background:'white'}}).webp().toFile('output/ocr/blank.webp');
await sharp({create:{width:4001,height:3000,channels:3,background:'white'}}).webp().toFile('output/ocr/too-large.webp');
await fs.writeFile('output/ocr/long-expected.txt',lines.join('\n'));
