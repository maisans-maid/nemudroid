'use strict';

module.exports = function createGradientStyle(ctx, x1, y1, x2, y2, c1='rgb(126,99,214)',c2='rgb(206,74,162)'){
    ctx.beginPath();

    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, c1);
        gradient.addColorStop(1, c2);
    return gradient;
};
