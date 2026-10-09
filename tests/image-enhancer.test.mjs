import test from 'node:test';
import assert from 'node:assert/strict';
import { outputSize, tilePlan, tileInput, compositeTile, sampleOriginal } from '../src/utils/imageEnhancer/core.js';

test('scale limits reject unsafe allocations instead of silently shrinking user images',()=>{
  assert.deepEqual(outputSize(192,128,4),{width:768,height:512});
  assert.deepEqual(outputSize(2000,2000,2),{width:4000,height:4000});
  assert.throws(()=>outputSize(2000,2000,4),/outputSize/);
  assert.throws(()=>outputSize(4097,1,1),/inputSize/);
  assert.throws(()=>outputSize(10,10,3),/settings/);
});

test('irregular tile cores cover every input pixel once and retain full model context',()=>{
  const width=269,height=145,counts=new Uint8Array(width*height),tiles=tilePlan(width,height);
  for(const tile of tiles){
    assert.equal(tile.left,Math.max(0,tile.x-36));assert.equal(tile.top,Math.max(0,tile.y-36));
    assert.equal(tile.width,Math.min(width,tile.x+tile.w+36)-tile.left);
    for(let y=tile.y;y<tile.y+tile.h;y++)for(let x=tile.x;x<tile.x+tile.w;x++)counts[y*width+x]++;
  }
  assert.ok(counts.every(n=>n===1));
});

test('RGB normalization composites transparency onto white and keeps source untouched',()=>{
  const source={width:2,height:1,data:Uint8ClampedArray.of(255,128,0,255,0,0,0,0)},before=new Uint8ClampedArray(source.data);
  const input=tileInput(source,tilePlan(2,1)[0]);
  assert.deepEqual([...input.slice(0,2)],[1,1]);assert.equal(input[5],1);
  assert.ok(Math.abs(input[2]-128/255)<1e-6);assert.deepEqual(source.data,before);
});

test('halo cropping and downscaling splice synthetic model tiles without seams',()=>{
  const source={width:137,height:5,data:new Uint8ClampedArray(137*5*4)};
  for(let i=0;i<source.data.length;i+=4){source.data[i]=(i/4)%137;source.data[i+1]=70;source.data[i+2]=90;source.data[i+3]=255;}
  for(const scale of [1,2,4]){
    const size=outputSize(source.width,source.height,scale),result={...size,data:new Uint8ClampedArray(size.width*size.height*4)};
    for(const tile of tilePlan(source.width,source.height)){
      const count=tile.width*4*tile.height*4,data=new Float32Array(count*3);
      for(let y=0;y<tile.height*4;y++)for(let x=0;x<tile.width*4;x++){
        const offset=((tile.top+Math.floor(y/4))*source.width+tile.left+Math.floor(x/4))*4;
        for(let c=0;c<3;c++)data[c*count+y*tile.width*4+x]=source.data[offset+c]/255;
      }
      compositeTile(result,data,source,tile,scale,1);
    }
    for(let y=0;y<result.height;y++)for(let x=0;x<result.width;x++){
      const offset=(y*result.width+x)*4;
      assert.equal(result.data[offset],Math.floor(x/scale));assert.equal(result.data[offset+3],255);
    }
  }
});

test('alpha uses premultiplied interpolation, while zero strength returns the baseline',()=>{
  const source={width:2,height:1,data:Uint8ClampedArray.of(200,100,50,255,0,0,0,0)};
  assert.deepEqual(sampleOriginal(source,0,0,1),[200,100,50,255]);
  const edge=sampleOriginal(source,2,0,2);assert.equal(edge[0],200);assert.equal(edge[3],63.75);
  const result={width:2,height:1,data:new Uint8ClampedArray(8)},tile=tilePlan(2,1)[0];
  compositeTile(result,new Float32Array(2*4*4*3).fill(1),source,tile,1,0);
  assert.deepEqual([...result.data],[200,100,50,255,0,0,0,0]);
});
