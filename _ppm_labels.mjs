import fs from 'fs';
const html = fs.readFileSync(process.env.TEMP + '/ppm.html', 'utf8');
const blocks = [
  ...html.matchAll(
    /data-preset="([^"]+)"[\s\S]*?<strong>([\s\S]*?)<\/strong>\s*<span>([\s\S]*?)<\/span>/g
  ),
];
for (const m of blocks) {
  const name = m[2].replace(/<[^>]+>/g, '').trim();
  console.log(m[1], '|', name, '|', m[3].trim());
}
console.log('--- auto ---');
const autos = [...html.matchAll(/data-auto-motion="([^"]+)"[^>]*>([\s\S]*?)<\/button>/g)];
for (const m of autos) console.log(m[1], m[2].replace(/\s+/g, ' ').trim());
console.log('--- param names ---');
const labels = [...html.matchAll(/class="parameter-name">\s*([\s\S]*?)<span/g)];
for (const m of labels) console.log(m[1].replace(/\s+/g, ' ').trim());
console.log('--- brush ---');
for (const k of ['brush-size', 'brush-strength', 'data-brush', 'data-tool']) {
  console.log(k, html.includes(k));
}
// paint tools
const tools = [...html.matchAll(/data-tool="([^"]+)"/g)].map((m) => m[1]);
console.log('tools', [...new Set(tools)]);
const record = [...html.matchAll(/data-record-([a-z-]+)="?([^" >]*)/g)].slice(0, 20);
console.log('record attrs sample', record.map((m) => m[0]).slice(0, 15));
