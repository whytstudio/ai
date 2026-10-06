const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const probe=file=>JSON.parse(cp.execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file],{encoding:'utf8'}));
const run=args=>new Promise((resolve,reject)=>{const child=cp.spawn('ffmpeg',['-hide_banner','-loglevel','error','-nostdin','-y',...args]);let err='';child.stderr.on('data',x=>err+=x);child.on('error',reject);child.on('exit',code=>code?reject(Error(err)):resolve());});
const manifestPath=path.join(root,'portfolio/video-formats.json');
async function main(){
 const pages=fs.readdirSync(root).filter(f=>f.endsWith('.html'));const originals=new Map();
 for(const p of pages)for(const m of fs.readFileSync(path.join(root,p),'utf8').matchAll(/<video\b([^>]*)>/g)){const attrs=m[1];const url=attrs.match(/data-video-original="([^"]+)"/)?.[1]||attrs.match(/\bsrc="([^"]+)"/)?.[1];if(url){const key=decodeURIComponent(url.replaceAll('&amp;','&'));if(!originals.has(key))originals.set(key,[]);originals.get(key).push(p);}}
 const manifest=fs.existsSync(manifestPath)?JSON.parse(fs.readFileSync(manifestPath)):{};fs.mkdirSync(path.join(root,'media/video'),{recursive:true});
 for(const [source,pages]of originals){
  const file=path.join(root,source),stat=fs.statSync(file);const hash=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  if(manifest[source]?.hash===hash&&(!source.startsWith('marketing/reel/')||manifest[source].height===768)&&manifest[source].sources.every(s=>fs.existsSync(path.join(root,s.src)))){console.log('Ready: '+source);continue;}
  const info=probe(file),v=info.streams.find(s=>s.codec_type==='video'),audio=info.streams.some(s=>s.codec_type==='audio');
  const heroOnly=source.startsWith('marketing/reel/');const max=heroOnly?768:1920;const ratio=Math.min(1,max/Math.max(v.width,v.height));const width=Math.round(v.width*ratio/2)*2,height=Math.round(v.height*ratio/2)*2;
  const stem=path.parse(source).name.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-'+hash.slice(0,8);const base='media/video/'+stem;const webm=base+'.webm',mp4=base+'.mp4';
  const input=['-i',file,'-map','0:v:0','-map','0:a:0?','-vf',`scale=${width}:${height}:flags=lanczos,setsar=1`];
  console.log('Encoding: '+source);
  await run([...input,'-c:v','libvpx-vp9','-crf','30','-b:v','0','-deadline','good','-cpu-used',heroOnly?'5':'4','-row-mt','1','-threads','4','-pix_fmt','yuv420p','-c:a','libopus','-b:a','96k',path.join(root,webm)]);
  await run([...input,'-c:v','libx264','-crf','22','-preset','fast','-threads','4','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-movflags','+faststart',path.join(root,mp4)]);
  for(const out of [webm,mp4]){const m=probe(path.join(root,out)),ov=m.streams.find(s=>s.codec_type==='video');if(ov.width!==width||ov.height!==height||Math.abs(Number(m.format.duration)-Number(info.format.duration))>.3||m.streams.some(s=>s.codec_type==='audio')!==audio)throw Error('Metadata mismatch: '+out);}
  manifest[source]={hash,sourceBytes:stat.size,duration:Number(info.format.duration),width,height,originalWidth:v.width,originalHeight:v.height,heroOnly,audio,sources:[{src:webm,type:'video/webm',bytes:fs.statSync(path.join(root,webm)).size},{src:mp4,type:'video/mp4',bytes:fs.statSync(path.join(root,mp4)).size}]};
  fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');console.log('Finished '+Object.keys(manifest).length+'/'+originals.size+': '+source+' ('+Math.round(manifest[source].sources[0].bytes/stat.size*100)+'% of original)');
 }
 if(fs.existsSync(path.join(root,'scripts/video-source-utils.cjs'))){
  const {applyVideoSources}=require('./video-source-utils.cjs');
  for(const page of pages){const file=path.join(root,page);fs.writeFileSync(file,applyVideoSources(fs.readFileSync(file,'utf8')));}
  require('./build-service-media.cjs').buildServiceMedia();
 }
 const values=Object.values(manifest);console.log(JSON.stringify({videos:values.length,originalBytes:values.reduce((n,v)=>n+v.sourceBytes,0),webmBytes:values.reduce((n,v)=>n+v.sources[0].bytes,0),mp4Bytes:values.reduce((n,v)=>n+v.sources[1].bytes,0)}));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
