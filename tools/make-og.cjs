/* One-off generator for the social-share image assets/og-image.png (1200x630).
   Zero-dependency: writes a PNG by hand with Node's zlib. Not part of the site build —
   run manually when the brand/copy changes:  node tools/make-og.cjs
   (No browser/image tooling here, so text uses a small built-in 5x7 bitmap font.) */
"use strict";
var zlib = require("zlib");
var fs = require("fs");
var path = require("path");

var W = 1200, H = 630;
var buf = Buffer.alloc(W * H * 3);

// ----- Colours (brand tokens) -----
var BG = [11, 15, 20], LIME = [163, 230, 53], TEAL = [45, 212, 191],
    ORANGE = [249, 115, 22], TEXT = [230, 237, 243], MUTED = [139, 151, 166];

function setPx(x, y, c) {
  x = x | 0; y = y | 0;
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  var i = (y * W + x) * 3; buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2];
}
function blend(x, y, c, a) {
  x = x | 0; y = y | 0;
  if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return;
  if (a > 1) a = 1;
  var i = (y * W + x) * 3;
  buf[i] = Math.round(buf[i] * (1 - a) + c[0] * a);
  buf[i + 1] = Math.round(buf[i + 1] * (1 - a) + c[1] * a);
  buf[i + 2] = Math.round(buf[i + 2] * (1 - a) + c[2] * a);
}
function rect(x, y, w, h, c) { for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) setPx(x + i, y + j, c); }
function disk(cx, cy, r, c, a) {
  for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++)
    if (dx * dx + dy * dy <= r * r) (a == null ? setPx(cx + dx, cy + dy, c) : blend(cx + dx, cy + dy, c, a));
}
function line(x0, y0, x1, y1, r, c, a) {
  var steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
  for (var s = 0; s <= steps; s++) { var t = s / steps; disk(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r, c, a); }
}

// ----- Background: dark fill + soft brand glows (echo the site's bg-motif) -----
for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) setPx(x, y, BG);
for (var y2 = 0; y2 < H; y2++) for (var x2 = 0; x2 < W; x2++) {
  var d1 = Math.hypot(x2 - 120, y2 - 60), d2 = Math.hypot(x2 - 1100, y2 - 600);
  blend(x2, y2, LIME, Math.max(0, 1 - d1 / 560) * 0.10);
  blend(x2, y2, TEAL, Math.max(0, 1 - d2 / 560) * 0.08);
}

// ----- Route line sweeping across (start dot -> finish), like the hero -----
var route = [[40, 540], [260, 470], [470, 360], [700, 430], [950, 280], [1170, 170]];
for (var p = 0; p < route.length - 1; p++)
  line(route[p][0], route[p][1], route[p + 1][0], route[p + 1][1], 4, LIME, 0.5);
disk(40, 540, 9, LIME);               // start
disk(1170, 170, 8, ORANGE);           // finish

// ----- Logo mark (ring + lime top-right arc + centre dot) -----
var LX = 150, LY = 168, R = 78, TH = 9;
for (var dy = -R - TH; dy <= R + TH; dy++) for (var dx = -R - TH; dx <= R + TH; dx++) {
  var d = Math.hypot(dx, dy);
  if (Math.abs(d - R) <= TH) {
    blend(LX + dx, LY + dy, TEAL, 0.45);
    var ang = Math.atan2(dy, dx);     // top-right quadrant -> lime accent
    if (ang > -1.9 && ang < 0.35) setPx(LX + dx, LY + dy, LIME);
  }
}
disk(LX, LY, 12, LIME);

// ----- 5x7 bitmap font (only the glyphs the copy needs) -----
var F = {
  "A": ["  #  ", " # # ", "#   #", "#   #", "#####", "#   #", "#   #"],
  "C": [" ### ", "#   #", "#    ", "#    ", "#    ", "#   #", " ### "],
  "E": ["#####", "#    ", "#    ", "#### ", "#    ", "#    ", "#####"],
  "F": ["#####", "#    ", "#    ", "#### ", "#    ", "#    ", "#    "],
  "G": [" ### ", "#   #", "#    ", "# ###", "#   #", "#   #", " ### "],
  "I": ["#####", "  #  ", "  #  ", "  #  ", "  #  ", "  #  ", "#####"],
  "M": ["#   #", "## ##", "# # #", "# # #", "#   #", "#   #", "#   #"],
  "N": ["#   #", "##  #", "# # #", "# # #", "#  ##", "#   #", "#   #"],
  "O": [" ### ", "#   #", "#   #", "#   #", "#   #", "#   #", " ### "],
  "R": ["#### ", "#   #", "#   #", "#### ", "# #  ", "#  # ", "#   #"],
  "S": [" ####", "#    ", "#    ", " ### ", "    #", "    #", "#### "],
  "T": ["#####", "  #  ", "  #  ", "  #  ", "  #  ", "  #  ", "  #  "]
};
function text(str, x, y, scale, c, gap) {
  var cx = x;
  for (var k = 0; k < str.length; k++) {
    var ch = str[k];
    if (ch === " ") { cx += 3 * scale + gap; continue; }
    var g = F[ch]; if (!g) { cx += 5 * scale + gap; continue; }
    for (var row = 0; row < 7; row++) for (var col = 0; col < 5; col++)
      if (g[row][col] === "#") rect(cx + col * scale, y + row * scale, scale, scale, c);
    cx += 5 * scale + gap;
  }
  return cx;
}

// ----- Wordmark + tagline -----
text("CRONO", 272, 112, 16, TEXT, 12);
rect(272, 235, 360, 7, LIME);                                   // accent underline
text("RACE TIMING FOR ORGANISERS", 274, 300, 6, MUTED, 6);

// chips row (geometric, no text): a lime + teal + orange pill to echo the themes
rect(274, 372, 120, 14, LIME);
rect(410, 372, 120, 14, TEAL);
rect(546, 372, 120, 14, ORANGE);

rect(0, H - 10, W, 10, LIME);                                   // bottom accent bar

// ----- Encode PNG -----
var crcTable = (function () { var t = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();
function crc32(b) { var c = 0xffffffff; for (var i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  var len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  var t = Buffer.from(type, "ascii");
  var crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
var ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
var raw = Buffer.alloc(H * (W * 3 + 1));
for (var ry = 0; ry < H; ry++) { raw[ry * (W * 3 + 1)] = 0; buf.copy(raw, ry * (W * 3 + 1) + 1, ry * W * 3, (ry + 1) * W * 3); }
var idat = zlib.deflateSync(raw, { level: 9 });
var png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))
]);
var out = path.join(__dirname, "..", "assets", "og-image.png");
fs.writeFileSync(out, png);
console.log("wrote " + out + " (" + png.length + " bytes, " + W + "x" + H + ")");
