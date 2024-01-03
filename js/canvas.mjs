// General canvas utility functions that only rely on the canvas API

/**
 *  Draw the outline of a rectangle with rounded corners.
 *
 *  Setup a strokeStyle before and stroke afterwards.
 *
 *  @param ctx The drawing context.
 *  @param x X-coordinate of top-left corner.
 *  @param y Y-coordinate of top-left corner.
 *  @param width Width of rect.
 *  @param height Height of rect.
 *  @param radius The radius of the corners. Should be a lot smaller than Math.min(height, width).
 */
export function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x, y + radius);
  ctx.lineTo(x, y + height - radius);
  ctx.arcTo(x, y + height, x + radius, y + height, radius);
  ctx.lineTo(x + width - radius, y + height);
  ctx.arcTo(x + width, y + height, x + width, y + height-radius, radius);
  ctx.lineTo(x + width, y + radius);
  ctx.arcTo(x + width, y, x + width - radius, y, radius);
  ctx.lineTo(x + radius, y);
  ctx.arcTo(x, y, x, y + radius, radius);
  ctx.stroke();
}

/**
 *  Draw a text baloon:
 *
 *  Setup a strokeStyle before and stroke afterwards.
 *
 *    x1,y1
 *      +-------------------------+
 *      |                         |
 *      |                         |
 *      |   x4  x5                |
 *      +---+   +-----------------+ x2, y2
 *          / /
 *         +
 *      x3, y3
 *
 *  @param ctx The drawing context.
 *  @param x1 The x-coordinate of the top-left corner.
 *  @param y1 The y-coordinate of the top-left corner.
 *  @param x2 The x-coordinate of the bottom-right corner.
 *  @param y2 The y-coordinate of the bottom-right corner.
 *  @param x3 The x-coordinate of the point representing the 'mouth-tip' of the balloon.
 *            Should be > x1 and < x2. By default will be x1 + 5.
 *  @param y3 The y-coordinate of the point representing the 'mouth-tip' of the balloon.
 *            Should be > y2. By default will be y2 + 10.
 *  @param x4 The left-most x-coordinate where the tip ends in the balloon.
 *            Should be > x1 and < x5. By default will be x1 + 25.
 *  @param x5 The right-most x-coordinate where the tip ends in the balloon.
 *            Should be > x4 and < x5. By default will be x4 + 10.
 */
export function textBalloon(ctx, x1, y1, x2, y2, x3, y3, x4, x5) {
  // Defaults
  x3 = x3 || x1 + 5;
  y3 = y3 || y2 + 10;
  x4 = x4 || x1 + 25;
  x5 = x5 || x4 + 10;
  // Draw
  ctx.beginPath();
  ctx.moveTo(x3, y3);                             // Bottom, mouth-point
  ctx.quadraticCurveTo(x4 - 5, y3 - 5, x4, y2);   // Bottom-point to bottom-left-opening
  ctx.moveTo(x3, y3);
  ctx.quadraticCurveTo(x5 - 5, y3 - 5, x5, y2);   //  Bottom-point to bottom-right-opening
  let middleY = Math.floor(y1 + (y2 - y1) / 2);
  ctx.quadraticCurveTo(x2, y2, x2, middleY);      // Bottom-right-opening to right-middle
  let middleX = Math.floor(x1 + (x2 - x1) / 2);
  ctx.quadraticCurveTo(x2, y1, middleX, y1);      // Right-middle to top-middle
  ctx.quadraticCurveTo(x1, y1, x1, middleY);      // Top-middle to left-middle
  ctx.quadraticCurveTo(x1, y2, x4, y2);           // Left-middle to left-bottom
}

/**
 *  Make an image of the current canvas contents and request this png image to be downloaded.
 *
 *  @param docuemnt The document to use for creating a <a> tag.
 *  @param canvas The image to take an image of.
 *  @param imageName The name to give to the image. Will be shown by the browser while downloading.
 */
export function downloadAsImage(document, canvas, imageName = 'download.png') {
  let link = document.createElement("a");
  link.download = imageName;
  canvas.toBlob(function (blob) {
    let url = URL.createObjectURL(blob);
    link.href = url;
    link.click();
  }, 'image/png');
}

/**
 *  Draw text centered in the provided box.
 *
 *  @param ctx The drawing context.
 *  @param txt The text to be draw within the provided box, on a single line.
 *  @param x1 The x-coordinate of the top-left corner.
 *  @param y1 The y-coordinate of the top-left corner.
 *  @param width The width of the box in which the text must be drawn.
 *  @param height The height of the box in which the text must be drawn.
 *  @param fontFamily The font family to be used.
 *  @param fontSize The desired font-size. A smaller fontsize will be used if needed.
 *
 *  @return The font-size used.
 */
export function drawCenteredText(ctx, txt, x1, y1, width, height, fontFamily = 'Courier New', fontSize = 32, textAlign = 'center', textBaseline = 'middle', fontStyle = 'normal normal') {
  ctx.save();
  ctx.font = fontStyle + " " + fontSize + "px " + fontFamily;
  ctx.textAlign = textAlign;
  ctx.textBaseline = textBaseline;
  let textBounds = ctx.measureText(txt);
  let halfHeight = Math.floor(height / 2 - 1);
  while ((fontSize > 4) &&
         (   (textBounds.width > width)
          || (textBounds.height > height)
          || (textBounds.actualBoundingBoxAscent >= halfHeight))) {
    fontSize -= 4;
    ctx.font = fontStyle + " " + fontSize + "px " + fontFamily;
    textBounds = ctx.measureText(txt);
  }
  ctx.fillText(txt, Math.floor(x1 + width / 2), Math.floor(y1 + height / 2), width);
  ctx.restore();
  return fontSize;
}

export function drawCenteredTextOutline(ctx, txt, x1, y1, width, height, fontFamily = 'Courier New', fontSize = 32, textAlign = 'center', textBaseline = 'middle', fontStyle = 'normal normal') {
  ctx.save();
  ctx.font = fontStyle + " " + fontSize + "px " + fontFamily;
  ctx.textAlign = textAlign;
  ctx.textBaseline = textBaseline;
  let textBounds = ctx.measureText(txt);
  let halfHeight = Math.floor(height / 2 - 1);
  while ((fontSize > 4) &&
  (   (textBounds.width > width)
      || (textBounds.height > height)
      || (textBounds.actualBoundingBoxAscent >= halfHeight))) {
    fontSize -= 4;
    ctx.font = fontStyle + " " + fontSize + "px " + fontFamily;
    textBounds = ctx.measureText(txt);
  }
  ctx.strokeText(txt, Math.floor(x1 + width / 2), Math.floor(y1 + height / 2), width);
  ctx.restore();
  return fontSize;
}

/**
 *  Draw a grid in the provided box.
 *
 *  @param ctx The drawing context.
 *  @param txt The text to be draw within the provided box, on a single line.
 *  @param gridX The x-coordinate of the top-left corner of the grid.
 *  @param gridY The y-coordinate of the top-left corner of the grid.
 *  @param gridColumns The number of grid columns.
 *  @param gridRows The number of grid rows.
 *  @param boxWidth The width of a single grid box.
 *  @param boxHeight The height of single grid box.
 *
 *  @return The font-size used.
 */
export function drawGrid(ctx, gridX, gridY, gridColumns, gridRows, boxWidth, boxHeight) {
  ctx.save();
  ctx.lineWidth = 1;
  //ctx.strokeStyle = 'yellow';
  //ctx.setLineDash([5, 3]);
  const width = gridColumns * boxWidth;
  const height = gridRows * boxHeight;
  for (let r = 0; r <= gridRows; r += 1) {
    ctx.beginPath();
    ctx.moveTo(gridX, gridY + (r * boxHeight));
    ctx.lineTo(gridX + width, gridY + (r * boxHeight));
    ctx.stroke();
  }
  for (let c = 0; c <= gridColumns; c += 1) {
    ctx.beginPath();
    ctx.moveTo(gridX + (c * boxWidth), gridY);
    ctx.lineTo(gridX + (c * boxWidth), gridY + height);
    ctx.stroke();
  }
  ctx.restore();
}