/**
 * Canvas drawing and raster export utilities.
 *
 * Provides functions for drawing rounded rectangles, text balloons,
 * fitted and centered text with automatic font-size downscaling,
 * grids, and client-side PNG downloads from canvas elements.
 *
 * @module canvas
 */

/**
 * Draw the outline of a rectangle with rounded corners.
 *
 * Caller should set `ctx.strokeStyle` beforehand and may call `ctx.stroke()` or `ctx.fill()`.
 *
 * @param {CanvasRenderingContext2D} ctx The drawing context.
 * @param {number} x X-coordinate of top-left corner.
 * @param {number} y Y-coordinate of top-left corner.
 * @param {number} width Width of rectangle.
 * @param {number} height Height of rectangle.
 * @param {number} radius The radius of the corners. Should be smaller than `Math.min(height, width) / 2`.
 * @returns {void}
 */
export function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x, y + radius);
  ctx.lineTo(x, y + height - radius);
  ctx.arcTo(x, y + height, x + radius, y + height, radius);
  ctx.lineTo(x + width - radius, y + height);
  ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
  ctx.lineTo(x + width, y + radius);
  ctx.arcTo(x + width, y, x + width - radius, y, radius);
  ctx.lineTo(x + radius, y);
  ctx.arcTo(x, y, x, y + radius, radius);
  ctx.stroke();
}

/**
 * Draw a text balloon path on the canvas context.
 *
 * Caller should set `ctx.strokeStyle` or `ctx.fillStyle` and stroke/fill afterwards.
 *
 * ```text
 *   x1,y1
 *     +-------------------------+
 *     |                         |
 *     |                         |
 *     |   x4  x5                |
 *     +---+   +-----------------+ x2, y2
 *         / /
 *        +
 *     x3, y3
 * ```
 *
 * @param {CanvasRenderingContext2D} ctx The drawing context.
 * @param {number} x1 The x-coordinate of the top-left corner.
 * @param {number} y1 The y-coordinate of the top-left corner.
 * @param {number} x2 The x-coordinate of the bottom-right corner.
 * @param {number} y2 The y-coordinate of the bottom-right corner.
 * @param {number} [x3] The x-coordinate of the tip point (defaults to `x1 + 5`).
 * @param {number} [y3] The y-coordinate of the tip point (defaults to `y2 + 10`).
 * @param {number} [x4] Left-most x-coordinate where tip meets balloon (defaults to `x1 + 25`).
 * @param {number} [x5] Right-most x-coordinate where tip meets balloon (defaults to `x4 + 10`).
 * @returns {void}
 */
export function textBalloon(ctx, x1, y1, x2, y2, x3, y3, x4, x5) {
  // Defaults
  x3 = x3 || x1 + 5;
  y3 = y3 || y2 + 10;
  x4 = x4 || x1 + 25;
  x5 = x5 || x4 + 10;
  // Draw
  ctx.beginPath();
  ctx.moveTo(x3, y3); // Bottom, mouth-point
  ctx.quadraticCurveTo(x4 - 5, y3 - 5, x4, y2); // Bottom-point to bottom-left-opening
  ctx.moveTo(x3, y3);
  ctx.quadraticCurveTo(x5 - 5, y3 - 5, x5, y2); //  Bottom-point to bottom-right-opening
  const middleY = Math.floor(y1 + (y2 - y1) / 2);
  ctx.quadraticCurveTo(x2, y2, x2, middleY); // Bottom-right-opening to right-middle
  const middleX = Math.floor(x1 + (x2 - x1) / 2);
  ctx.quadraticCurveTo(x2, y1, middleX, y1); // Right-middle to top-middle
  ctx.quadraticCurveTo(x1, y1, x1, middleY); // Top-middle to left-middle
  ctx.quadraticCurveTo(x1, y2, x4, y2); // Left-middle to left-bottom
}

/**
 * Capture current canvas content as a PNG image and trigger browser download.
 *
 * @param {Document} document The document object used to construct temporary download anchor.
 * @param {HTMLCanvasElement} canvas The canvas element to export.
 * @param {string} [imageName='download.png'] File name presented in the browser download dialog.
 * @returns {void}
 */
export function downloadAsImage(document, canvas, imageName = 'download.png') {
  const link = document.createElement('a');
  link.download = imageName;
  canvas.toBlob(function (blob) {
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.click();
  }, 'image/png');
}

/**
 * Draw text filled and centered in the specified bounding box, automatically downscaling font size if needed.
 *
 * @param {CanvasRenderingContext2D} ctx The drawing context.
 * @param {string} txt The text to be drawn on a single line.
 * @param {number} x1 The x-coordinate of the top-left corner.
 * @param {number} y1 The y-coordinate of the top-left corner.
 * @param {number} width The width of the bounding box.
 * @param {number} height The height of the bounding box.
 * @param {string} [fontFamily='Courier New'] The font family name.
 * @param {number} [fontSize=32] Desired initial font size in pixels.
 * @param {CanvasTextAlign} [textAlign='center'] Canvas text alignment.
 * @param {CanvasTextBaseline} [textBaseline='middle'] Canvas text baseline.
 * @param {string} [fontStyle='normal normal'] Font weight and style prefix.
 * @returns {number} The actual font size used.
 */
export function drawCenteredText(
  ctx,
  txt,
  x1,
  y1,
  width,
  height,
  fontFamily = 'Courier New',
  fontSize = 32,
  textAlign = 'center',
  textBaseline = 'middle',
  fontStyle = 'normal normal',
) {
  ctx.save();
  ctx.font = fontStyle + ' ' + fontSize + 'px ' + fontFamily;
  ctx.textAlign = textAlign;
  ctx.textBaseline = textBaseline;
  let textBounds = ctx.measureText(txt);
  const halfHeight = Math.floor(height / 2 - 1);
  while (
    fontSize > 4 &&
    (textBounds.width > width || textBounds.height > height || textBounds.actualBoundingBoxAscent >= halfHeight)
  ) {
    fontSize -= 4;
    ctx.font = fontStyle + ' ' + fontSize + 'px ' + fontFamily;
    textBounds = ctx.measureText(txt);
  }
  ctx.fillText(txt, Math.floor(x1 + width / 2), Math.floor(y1 + height / 2), width);
  ctx.restore();
  return fontSize;
}

/**
 * Draw stroked outline of text centered in the specified bounding box, downscaling font size if needed.
 *
 * @param {CanvasRenderingContext2D} ctx The drawing context.
 * @param {string} txt The text to be drawn on a single line.
 * @param {number} x1 The x-coordinate of the top-left corner.
 * @param {number} y1 The y-coordinate of the top-left corner.
 * @param {number} width The width of the bounding box.
 * @param {number} height The height of the bounding box.
 * @param {string} [fontFamily='Courier New'] The font family name.
 * @param {number} [fontSize=32] Desired initial font size in pixels.
 * @param {CanvasTextAlign} [textAlign='center'] Canvas text alignment.
 * @param {CanvasTextBaseline} [textBaseline='middle'] Canvas text baseline.
 * @param {string} [fontStyle='normal normal'] Font weight and style prefix.
 * @returns {number} The actual font size used.
 */
export function drawCenteredTextOutline(
  ctx,
  txt,
  x1,
  y1,
  width,
  height,
  fontFamily = 'Courier New',
  fontSize = 32,
  textAlign = 'center',
  textBaseline = 'middle',
  fontStyle = 'normal normal',
) {
  ctx.save();
  ctx.font = fontStyle + ' ' + fontSize + 'px ' + fontFamily;
  ctx.textAlign = textAlign;
  ctx.textBaseline = textBaseline;
  let textBounds = ctx.measureText(txt);
  const halfHeight = Math.floor(height / 2 - 1);
  while (
    fontSize > 4 &&
    (textBounds.width > width || textBounds.height > height || textBounds.actualBoundingBoxAscent >= halfHeight)
  ) {
    fontSize -= 4;
    ctx.font = fontStyle + ' ' + fontSize + 'px ' + fontFamily;
    textBounds = ctx.measureText(txt);
  }
  ctx.strokeText(txt, Math.floor(x1 + width / 2), Math.floor(y1 + height / 2), width);
  ctx.restore();
  return fontSize;
}

/**
 * Draw a grid within the specified bounding box.
 *
 * Caller should set `ctx.strokeStyle` beforehand.
 *
 * @param {CanvasRenderingContext2D} ctx The drawing context.
 * @param {number} gridX The x-coordinate of the top-left corner of the grid.
 * @param {number} gridY The y-coordinate of the top-left corner of the grid.
 * @param {number} gridColumns The number of grid columns.
 * @param {number} gridRows The number of grid rows.
 * @param {number} boxWidth The width of a single grid cell.
 * @param {number} boxHeight The height of a single grid cell.
 * @returns {void}
 */
export function drawGrid(ctx, gridX, gridY, gridColumns, gridRows, boxWidth, boxHeight) {
  ctx.save();
  ctx.lineWidth = 1;
  const width = gridColumns * boxWidth;
  const height = gridRows * boxHeight;
  for (let r = 0; r <= gridRows; r += 1) {
    ctx.beginPath();
    ctx.moveTo(gridX, gridY + r * boxHeight);
    ctx.lineTo(gridX + width, gridY + r * boxHeight);
    ctx.stroke();
  }
  for (let c = 0; c <= gridColumns; c += 1) {
    ctx.beginPath();
    ctx.moveTo(gridX + c * boxWidth, gridY);
    ctx.lineTo(gridX + c * boxWidth, gridY + height);
    ctx.stroke();
  }
  ctx.restore();
}
