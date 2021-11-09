'use strict';

module.exports = function createRoundedRect(ctx, x1, y1, x2, y2, radius){
    ctx.beginPath();
    ctx.moveTo(x1, radius);
    ctx.arcTo(x1, y1, x1 + radius, y1, radius);
    ctx.lineTo(x2 - radius, y1);
    ctx.arcTo(x2, y1, x2, radius, radius);
    ctx.lineTo(x2, y2 - radius);
    ctx.arcTo(x2, y2, x2-radius ,y2 ,radius);
    ctx.lineTo(radius, y2);
    ctx.arcTo(x1, y2, x1, y2 - radius, radius);
    ctx.closePath();
};
