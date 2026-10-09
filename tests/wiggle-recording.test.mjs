import test from 'node:test';
import assert from 'node:assert/strict';
import {startLiveRecording,videoMime} from '../src/utils/wiggle/liveRecording.js';

function environment() {
  const original={document:globalThis.document,MediaRecorder:globalThis.MediaRecorder};
  const draws=[];let trackStops=0;
  const canvas={width:0,height:0,getContext:()=>({fillRect(){},drawImage(...args){draws.push(args);}}),captureStream:()=>({getTracks:()=>[{stop(){trackStops++;}}]})};
  class Recorder {
    static isTypeSupported(type){return type.startsWith('video/webm');}
    constructor(stream,options){this.stream=stream;this.mimeType=options.mimeType;this.state='inactive';}
    start(){this.state='recording';}
    stop(){this.state='inactive';this.ondataavailable({data:new Blob(['recorded-frame'])});this.onstop();}
  }
  globalThis.document={createElement:()=>canvas};globalThis.MediaRecorder=Recorder;
  return {draws,get trackStops(){return trackStops;},restore(){globalThis.document=original.document;globalThis.MediaRecorder=original.MediaRecorder;}};
}

test('Unsupported MP4 is explicitly unavailable rather than a renamed WebM',()=>{
  const env=environment();try{assert.equal(videoMime('mp4'),null);assert(videoMime('webm').startsWith('video/webm'));assert.throws(()=>startLiveRecording({width:720,height:360},{format:'mp4'}),/Unsupported/);}finally{env.restore();}
});

test('Camera stabilization preserves aspect-correct framing from the first captured frame',async()=>{
  const env=environment();try{
    const recording=startLiveRecording({width:720,height:360},{format:'webm',duration:10,presentation:'camera-follow',initialData:{frame:{x:.1,y:.05},aspect:{sx:2,sy:1}}});
    assert(Math.abs(env.draws[0][1]+33.3)<1e-8);assert(Math.abs(env.draws[0][2]+16.65)<1e-8);
    recording.stop();const output=await recording.done;assert.equal(output.filename,'imghub-wiggle.webm');assert.equal(output.blob.type,'video/webm');assert.equal(output.width,720);assert.equal(output.height,360);assert.equal(env.trackStops,1);
  }finally{env.restore();}
});

test('Cancellation rejects the result and stops the capture stream',async()=>{
  const env=environment();try{
    const recording=startLiveRecording({width:720,height:720},{format:'webm',duration:10});
    recording.cancel();await assert.rejects(recording.done,error=>error.name==='AbortError');assert.equal(env.trackStops,1);
  }finally{env.restore();}
});
