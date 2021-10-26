const { createCanvas, loadImage } = require('node-canvas');
const GIFEncoder = require('gifencoder');
const { readdirSync, writeFileSync } = require('fs');
const { join } = require('path');

(async () => {
  const encoder = new GIFEncoder(200,200);
  const buffers = [];

  encoder.createReadStream()
  .on('data', buffer => buffers.push(buffer))
  .on('end', () => {
    const { writeFileSync } = require('fs');
    writeFileSync('./assets/images/chibi/result/' + 'output.gif', Buffer.concat(buffers));
  });

  encoder.start();
  encoder.setRepeat(0);
  encoder.setDelay(100);

  for (const image of readdirSync(join(__dirname, 'frames'))){
    const canvas = createCanvas(200, 200);
    const ctx = canvas.getContext('2d');
    const frame = await loadImage(join(__dirname, 'frames', image));
    ctx.drawImage(frame,0,0)
    encoder.addFrame(ctx);
  };

  encoder.finish();
})();
