/* One-off generator for the PWA / home-screen icons (assets/icon-180.png, icon-192.png,
   icon-512.png). iOS rasterises an SVG apple-touch-icon poorly (blurry on the Home Screen),
   so we ship crisp PNGs. Zero-dependency: draws the Crono mark (faint ring + lime arc + dot)
   on a dark full-bleed square and writes PNGs by hand with Node's zlib, supersampled for AA.
   Not part of the build/runtime. Re-run if the logo changes:  node tools/make-icon.cjs */
"use strict";
var zlib = require("zlib");
var fs = require("fs");
var path = require("path");

var BG = [13, 18, 24];          // dark square (iOS masks the corners; Android maskable-safe)
var RING = [86, 98, 114];       // faint grey ring
var LIME = [163, 230, 53];      // arc + centre dot

function makeIcon(SIZE) {
  var SS = 4, BW = SIZE * SS, BH = SIZE * SS;
  var big = Buffer.alloc(BW * BH * 3);
  for (var i = 0; i < BW * BH; i++) { big[i * 3] = BG[0]; big[i * 3 + 1] = BG[1]; big[i * 3 + 2] = BG[2]; }

  function blend(x, y, c, a) {
    x |= 0; y |= 0; if (x < 0 || y < 0 || x >= BW || y >= BH || a <= 0) return; if (a > 1) a = 1;
    var i = (y * BW + x) * 3;
    big[i] = Math.round(big[i] * (1 - a) + c[0] * a);
    big[i + 1] = Math.round(big[i + 1] * (1 - a) + c[1] * a);
    big[i + 2] = Math.round(big[i + 2] * (1 - a) + c[2] * a);
  }
  function disk(cx, cy, r, c, a) {
    cx *= SS; cy *= SS; r *= SS; var r2 = r * r;
    for (var dy = -r - 1; dy <= r + 1; dy++) for (var dx = -r - 1; dx <= r + 1; dx++) {
      var d2 = dx * dx + dy * dy; if (d2 > (r + 1) * (r + 1)) continue;
      blend(cx + dx, cy + dy, c, a == null ? 1 : a);
    }
  }
  function arc(cx, cy, R, th, c, deg0, deg1) {
    var step = 0.25 / SS;
    for (var a = deg0; a <= deg1; a += step) {
      var rad = a * Math.PI / 180;
      disk(cx + R * Math.cos(rad), cy + R * Math.sin(rad), th / 2, c, 1);
    }
  }

  var cx = SIZE / 2, cy = SIZE / 2, R = SIZE * 0.30;
  arc(cx, cy, R, SIZE * 0.030, RING, 0, 360);          // faint full ring
  arc(cx, cy, R, SIZE * 0.040, LIME, -90, 35);         // lime arc (top → upper-right)
  disk(cx, cy, SIZE * 0.075, LIME);                    // lime centre dot

  // ----- downsample (anti-alias) -----
  var out = Buffer.alloc(SIZE * SIZE * 3);
  for (var oy = 0; oy < SIZE; oy++) for (var ox = 0; ox < SIZE; ox++) {
    var r = 0, g = 0, b = 0;
    for (var sy = 0; sy < SS; sy++) for (var sx = 0; sx < SS; sx++) {
      var ii = ((oy * SS + sy) * BW + (ox * SS + sx)) * 3; r += big[ii]; g += big[ii + 1]; b += big[ii + 2];
    }
    var n = SS * SS, oi = (oy * SIZE + ox) * 3; out[oi] = Math.round(r / n); out[oi + 1] = Math.round(g / n); out[oi + 2] = Math.round(b / n);
  }
  return encodePng(SIZE, SIZE, out);
}

// ----- PNG encoder (RGB) -----
var crcTable = (function () { var t = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();
function crc32(b) { var c = 0xffffffff; for (var i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) { var len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0); var t = Buffer.from(type, "ascii"); var crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0); return Buffer.concat([len, t, data, crc]); }
function encodePng(W, H, rgb) {
  var ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2;
  var raw = Buffer.alloc(H * (W * 3 + 1));
  for (var ry = 0; ry < H; ry++) { raw[ry * (W * 3 + 1)] = 0; rgb.copy(raw, ry * (W * 3 + 1) + 1, ry * W * 3, (ry + 1) * W * 3); }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

[180, 192, 512].forEach(function (size) {
  var png = makeIcon(size);
  fs.writeFileSync(path.join(__dirname, "..", "assets", "icon-" + size + ".png"), png);
  console.log("wrote assets/icon-" + size + ".png (" + png.length + " bytes, " + size + "x" + size + ")");
});
