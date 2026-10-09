import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDimensions,planTiles,mergeLines,textFromLines} from '../src/utils/ocr/core.js';
import {OCRClient} from '../src/utils/ocr/client.js';
const line=(text,x,y,w=80,h=20,score=.95)=>({text,score,poly:[[x,y],[x+w,y],[x+w,y+h],[x,y+h]]});
test('OCR bounds prevent unsafe allocations but accept long screenshots',()=>{
  validateDimensions(600,16000);
  assert.throws(()=>validateDimensions(600,16001),/dimensions/);
  assert.throws(()=>validateDimensions(4000,4000),/dimensions/);
  assert.throws(()=>validateDimensions(0,20),/dimensions/);
});
test('overlapping tiles cover long and wide images without gaps',()=>{
  for(const [width,height] of [[980,540],[800,5000],[3000,3500]]){
    const tiles=planTiles(width,height);
    for(const tile of tiles){assert.ok(tile.width<=2048&&tile.height<=1536);assert.ok(tile.x>=0&&tile.y>=0&&tile.x+tile.width<=width&&tile.y+tile.height<=height);}
    for(let y=0;y<height;y+=31)for(let x=0;x<width;x+=31)assert.ok(tiles.some(t=>x>=t.x&&x<t.x+t.width&&y>=t.y&&y<t.y+t.height));
    assert.ok(tiles.some(t=>t.x+t.width===width&&t.y+t.height===height));
  }
});
test('deduplicate overlapping detections by confidence, preserve repeated text at distinct locations and reading order',()=>{
  const result=mergeLines([line('second',0,80),line('same',0,20,80,20,.7),line('same',1,21,80,20,.99),line('same',0,140),line('right',120,22),line('third',0,110)]);
  assert.deepEqual(result.map(x=>x.text),['same','right','second','third','same']);
  assert.equal(result[0].score,.99);
  assert.equal(mergeLines([{text:'bad',score:.99,poly:[[NaN,0],[0,0],[1,1],[1,0]]}]).length,0);
});
test('text export preserves line breaks and optional CJK/Latin spacing',()=>{
  const result=[{text:'你好'},{text:'世界'},{text:'Hello'},{text:'world'}];
  assert.equal(textFromLines(result),'你好\n世界\nHello\nworld');
  assert.equal(textFromLines(result,'paragraph'),'你好世界 Hello world');
});
test('cancel aborts loading, terminates inference and rejects pending requests',async()=>{
  const client=new OCRClient();let terminated=false;
  client.controller=new AbortController();
  client.worker={postMessage(){},terminate(){terminated=true;}};
  const result=client.request('predict',{});
  client.cancel();
  await assert.rejects(result,error=>error.name==='AbortError');
  assert.equal(terminated,true);assert.equal(client.controller.signal.aborted,true);
  assert.equal(client.pending.size,0);assert.equal(client.worker,null);
});
test('failed message transfer releases its pending request and timer',async()=>{
  const client=new OCRClient();client.worker={postMessage(){throw new Error('transfer failed');}};
  await assert.rejects(client.request('predict',{}),/transfer failed/);
  assert.equal(client.pending.size,0);
});
