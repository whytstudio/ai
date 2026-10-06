const fs = require('node:fs/promises');
const path = require('node:path');
const cp = require('node:child_process');

let sharp = null;
try {
  sharp = require('sharp');
} catch {}

function getImageMetadata(source) {
  if (sharp) {
    return sharp(source).metadata().then(meta => ({
      width: meta.autoOrient?.width || meta.width,
      height: meta.autoOrient?.height || meta.height
    }));
  }
  const out = JSON.parse(cp.execFileSync('ffprobe', [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height',
    '-of', 'json',
    source
  ], { encoding: 'utf8' }));
  return Promise.resolve({
    width: out.streams[0].width,
    height: out.streams[0].height
  });
}

// Keep text and packaging sharp: size is a target, never a reason to crush quality.
async function webp(source, target, width, quality = 84) {
  const sourceStat = await fs.stat(source);
  const targetStat = await fs.stat(target).catch(() => null);
  if (targetStat && targetStat.mtimeMs >= sourceStat.mtimeMs) return;
  await fs.mkdir(path.dirname(target), { recursive: true });

  if (sharp) {
    let buffer = await sharp(source).rotate().resize({ width, withoutEnlargement: true })
      .webp({ quality, effort: 5 }).toBuffer();
    if (buffer.length > 100 * 1024 && quality < 88) {
      buffer = await sharp(source).rotate().resize({ width, withoutEnlargement: true })
        .webp({ quality: 80, effort: 6 }).toBuffer();
    }
    await fs.writeFile(target, buffer);
  } else {
    cp.execFileSync('ffmpeg', [
      '-hide_banner',
      '-loglevel', 'error',
      '-y',
      '-i', source,
      '-vf', `scale='min(${width},iw)':-2`,
      '-c:v', 'libwebp',
      '-quality', String(quality),
      target
    ]);
  }
}

async function variants(source, directory, basename, urlDirectory) {
  const { width, height } = await getImageMetadata(source);
  const entries = [];
  for (const size of [160, 320, 640, 960].filter(size => size < width)) {
    const name = `${basename}-${size}.webp`;
    await webp(source, path.join(directory, name), size);
    entries.push({ src: `${urlDirectory}/${name}`, width: size });
  }
  return { width, height, entries };
}

module.exports = { webp, variants, getImageMetadata };
