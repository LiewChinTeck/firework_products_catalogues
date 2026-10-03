const path = require('node:path');
const fs = require('node:fs');
const fsp = fs.promises;
const {execFile,execFileSync} = require('node:child_process');
const {promisify} = require('node:util');
const multer = require('multer');
const sharp = require('sharp');
const run = promisify(execFile);
const IMAGE_LIMIT = 10 * 1024 * 1024, VIDEO_LIMIT = 100 * 1024 * 1024;
const ROOT = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname,'uploads'));
const TEMP = path.join(ROOT,'.tmp'), PRODUCTS = path.join(ROOT,'products');
const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg', FFPROBE = process.env.FFPROBE_PATH || 'ffprobe';

for (const folder of [TEMP,PRODUCTS]) fs.mkdirSync(folder,{recursive:true});
for (const binary of [FFMPEG,FFPROBE]) execFileSync(binary,['-version'],{stdio:'ignore',timeout:10000,windowsHide:true});

const active = new Set();
const folder = id => path.join(PRODUCTS,String(id).padStart(3,'0'));
const fail = (message,status=400) => Object.assign(new Error(message),{status});
const erase = file => file ? fsp.rm(file,{force:true}).catch(console.error) : Promise.resolve();
const receivers = Object.fromEntries(['image','video'].map(kind => [kind,multer({
 dest:TEMP,
 limits:{fileSize:kind === 'image' ? IMAGE_LIMIT : VIDEO_LIMIT,files:1,fields:0,parts:2}
}).single('file')]));
const inputOptions = ['-protocol_whitelist','file,pipe','-format_whitelist','mov,matroska,avi,mpeg,mpegts,ogg,flv'];

async function probe(file) {
 try {
  const {stdout} = await run(FFPROBE,[
   '-v','error',...inputOptions,'-show_format','-show_streams','-of','json',file
  ],{timeout:30000,maxBuffer:2*1024*1024,windowsHide:true});
  return JSON.parse(stdout);
 } catch {
  throw fail('Cannot read this video. Use MP4, MOV, WebM or another supported video file.');
 }
}

async function convert(kind,input,output) {
 if (kind === 'image') {
  try {
   const image = sharp(input,{limitInputPixels:40000000,failOn:'error'});
   const metadata = await image.metadata();
   if (!['jpeg','png','webp','avif','heif','tiff'].includes(metadata.format) || (metadata.pages || 1) > 1) {
    throw new Error('Unsupported image');
   }
   await image.rotate().webp({quality:90}).toFile(output);
  } catch {
   throw fail('Invalid image. Use a still JPG, PNG, WebP, AVIF or TIFF image, up to 40 megapixels.');
  }
 } else {
  const metadata = await probe(input);
  const streams = metadata.streams || [];
  const video = streams.find(s => s.codec_type === 'video' && !s.disposition?.attached_pic);
  const durations = [metadata.format?.duration,...streams.map(s => s.duration)].map(Number).filter(Number.isFinite);
  const duration = Math.max(0,...durations);

  if (!video || !duration) throw fail('A valid video with a readable duration is required.');
  if (duration > 60) throw fail('Video must be 60 seconds or shorter.');

  const audio = streams.find(s => s.codec_type === 'audio');
  const copyVideo = video.codec_name === 'h264' && video.pix_fmt === 'yuv420p';

  const videoOptions = copyVideo
   ? ['-c:v','copy']
   : [
      '-vf','pad=ceil(iw/2)*2:ceil(ih/2)*2',
      '-c:v','libx264','-preset','veryfast','-crf','20',
      '-pix_fmt','yuv420p','-threads','2'
     ];

  const audioOptions = !audio || (audio.codec_name === 'aac' && audio.profile === 'LC')
   ? ['-c:a','copy']
   : ['-c:a','aac','-b:a','160k'];

  const started = Date.now();
  try {
   await run(FFMPEG,[
    '-hide_banner','-loglevel','error','-nostdin','-y',
    ...inputOptions,'-i',input,
    '-map',`0:${video.index}`,'-map','0:a:0?',
    '-t','60','-sn','-dn','-map_metadata','-1',
    ...videoOptions,...audioOptions,
    '-movflags','+faststart',output
   ],{
    timeout:300000,maxBuffer:2*1024*1024,
    windowsHide:true,killSignal:'SIGKILL'
   });
   console.info(`Video ${copyVideo ? 'stream copied' : 'encoded (veryfast)'} in ${((Date.now()-started)/1000).toFixed(1)}s`);
  } catch (error) {
   console.error(error.message);
   throw fail('Video conversion failed or exceeded five minutes. Check FFmpeg and try a smaller video.',422);
  }
 }

 const size = (await fsp.stat(output)).size;
 if (!size || size > (kind === 'image' ? IMAGE_LIMIT : VIDEO_LIMIT)) {
  throw fail(`Converted ${kind} exceeds its size limit. Use a smaller source.`,413);
 }
}

function upload(db,kind) {
 return async (req,res,next) => {
  const id = req.product.id;
  if (active.has(id) || active.size >= 2) {
   return next(fail('An upload is processing. Try again shortly.',409));
  }

  active.add(id);
  let output,backup,target,saved,failure,hadOld=false,replaced=false;

  try {
   await new Promise((resolve,reject) => receivers[kind](req,res,error => error ? reject(error) : resolve()));
   if (!req.file) throw fail('Choose a file to upload.');
   if (req.aborted) throw fail('Upload cancelled.');

   output = `${req.file.path}.${kind === 'image' ? 'webp' : 'mp4'}`;
   backup = `${req.file.path}.backup`;
   await convert(kind,req.file.path,output);
   await fsp.mkdir(folder(id),{recursive:true});
   target = path.join(folder(id),kind === 'image' ? 'image.webp' : 'video.mp4');

   try {
    await fsp.copyFile(target,backup);
    hadOld = true;
   } catch (error) {
    if (error.code !== 'ENOENT') throw error;
   }

   await fsp.rename(output,target);
   replaced = true;
   const url = `/uploads/products/${String(id).padStart(3,'0')}/${path.basename(target)}?v=${Date.now()}`;
   const result = db.prepare(`UPDATE products SET ${kind}=? WHERE id=?`).run(url,id);
   if (!result.changes) throw fail('Product no longer exists.',404);

   replaced = false;
   saved = db.prepare('SELECT * FROM products WHERE id=?').get(id);
  } catch (error) {
   if (replaced) {
    try {
     if (hadOld) await fsp.rename(backup,target);
     else await fsp.rm(target,{force:true});
    } catch (rollbackError) {
     console.error('Media rollback failed:',rollbackError);
    }
   }

   if (error.code === 'LIMIT_FILE_SIZE') {
    failure = fail(kind === 'image' ? 'Image: maximum 10 MB.' : 'Video: maximum 100 MB.',413);
   } else if (error instanceof multer.MulterError) {
    failure = fail('Upload exactly one file using the file field.');
   } else {
    failure = error;
   }
  } finally {
   await Promise.all([erase(req.file?.path),erase(output),erase(backup)]);
   active.delete(id);
  }

  if (failure) return next(failure);
  res.json(saved);
 };
}

module.exports = {PRODUCTS,upload,busy:id => active.has(id)};