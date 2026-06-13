/* One-off generator for the social-share image assets/og-image.png (1200x630).
   Zero-dependency: writes a PNG by hand with Node's zlib. Not part of the site build —
   run manually when the brand/copy changes:  node tools/make-og.cjs
   No image/font tooling here, so glyphs are drawn from a small built-in vector (stroke)
   font and the whole image is supersampled 2x then box-downsampled for anti-aliasing. */
"use strict";
var zlib = require("zlib");
var fs = require("fs");
var path = require("path");

var SS = 2, W = 1200, H = 630, BW = W * SS, BH = H * SS;
var big = Buffer.alloc(BW * BH * 3);

var BG = [11, 15, 20], LIME = [163, 230, 53], TEAL = [45, 212, 191],
    ORANGE = [249, 115, 22], TEXT = [233, 240, 246], MUTED = [150, 162, 176], DARK = [11, 15, 20];

function bset(x, y, c) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= BW || y >= BH) return; var i = (y * BW + x) * 3; big[i] = c[0]; big[i + 1] = c[1]; big[i + 2] = c[2]; }
function bblend(x, y, c, a) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= BW || y >= BH || a <= 0) return; if (a > 1) a = 1; var i = (y * BW + x) * 3; big[i] = Math.round(big[i] * (1 - a) + c[0] * a); big[i + 1] = Math.round(big[i + 1] * (1 - a) + c[1] * a); big[i + 2] = Math.round(big[i + 2] * (1 - a) + c[2] * a); }
// all helpers take final (1200x630) coords; SS is applied inside
function disk(cx, cy, r, c, a) { cx *= SS; cy *= SS; r *= SS; var r2 = r * r; for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r2) (a == null ? bset(cx + dx, cy + dy, c) : bblend(cx + dx, cy + dy, c, a)); }
function line(x0, y0, x1, y1, r, c, a) { var n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * SS); for (var s = 0; s <= n; s++) { var t = s / n; disk(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r, c, a); } }
function rect(x, y, w, h, c) { for (var j = 0; j < h * SS; j++) for (var i = 0; i < w * SS; i++) bset(x * SS + i, y * SS + j, c); }
function rrect(x, y, w, h, rad, c) { // rounded-rect fill (solid)
  for (var j = 0; j < h * SS; j++) for (var i = 0; i < w * SS; i++) {
    var px = i / SS, py = j / SS, ok = true, R = rad;
    if (px < R && py < R) ok = (px - R) * (px - R) + (py - R) * (py - R) <= R * R;
    else if (px > w - R && py < R) ok = (px - (w - R)) * (px - (w - R)) + (py - R) * (py - R) <= R * R;
    else if (px < R && py > h - R) ok = (px - R) * (px - R) + (py - (h - R)) * (py - (h - R)) <= R * R;
    else if (px > w - R && py > h - R) ok = (px - (w - R)) * (px - (w - R)) + (py - (h - R)) * (py - (h - R)) <= R * R;
    if (ok) bset(x * SS + i, y * SS + j, c);
  }
}

// ----- Background: dark + soft brand glows -----
for (var i = 0; i < BW * BH; i++) { big[i * 3] = BG[0]; big[i * 3 + 1] = BG[1]; big[i * 3 + 2] = BG[2]; }
for (var y = 0; y < BH; y++) for (var x = 0; x < BW; x++) {
  var d1 = Math.hypot(x - 120 * SS, y - 60 * SS), d2 = Math.hypot(x - 1100 * SS, y - 600 * SS);
  bblend(x, y, LIME, Math.max(0, 1 - d1 / (560 * SS)) * 0.10);
  bblend(x, y, TEAL, Math.max(0, 1 - d2 / (560 * SS)) * 0.08);
}

// ----- Route line (subtle, behind) -----
var route = [[40, 560], [250, 500], [470, 400], [700, 470], [950, 330], [1170, 230]];
for (var p = 0; p < route.length - 1; p++) line(route[p][0], route[p][1], route[p + 1][0], route[p + 1][1], 3.5, LIME, 0.32);
disk(40, 560, 8, LIME, 0.6); disk(1170, 230, 7, ORANGE, 0.7);

// ----- Logo mark -----
var LX = 150, LY = 175, R = 76, TH = 9;
for (var dy = -(R + TH); dy <= R + TH; dy++) for (var dx = -(R + TH); dx <= R + TH; dx++) {
  var d = Math.hypot(dx, dy);
  if (Math.abs(d - R) <= TH) { bblend(LX + dx / SS * SS, LY + dy, TEAL, 0.0); } // noop guard
}
// draw ring with disks for AA
for (var a0 = 0; a0 < 360; a0 += 0.6) { var rad = a0 * Math.PI / 180; var rx = LX + R * Math.cos(rad), ry = LY + R * Math.sin(rad); var lime = (rad > -1.9 && rad < 0.35) || (a0 > 270 || a0 < 20); disk(rx, ry, TH, (a0 >= 275 || a0 <= 25) ? LIME : TEAL, (a0 >= 275 || a0 <= 25) ? 1 : 0.5); }
disk(LX, LY, 11, LIME);

// ----- Vector (stroke) font: only the glyphs the copy needs -----
function ell(cx, cy, rx, ry, d0, d1, steps) { var pp = []; for (var k = 0; k <= steps; k++) { var t = (d0 + (d1 - d0) * k / steps) * Math.PI / 180; pp.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)]); } return pp; }
var FONT = {
  "A": { w: 0.66, s: [[[0.05, 0.95], [0.33, 0.05], [0.61, 0.95]], [[0.17, 0.62], [0.49, 0.62]]] },
  "C": { w: 0.66, s: [ell(0.34, 0.5, 0.29, 0.45, 55, 305, 28)] },
  "E": { w: 0.60, s: [[[0.08, 0.05], [0.08, 0.95]], [[0.08, 0.05], [0.54, 0.05]], [[0.08, 0.5], [0.48, 0.5]], [[0.08, 0.95], [0.56, 0.95]]] },
  "F": { w: 0.58, s: [[[0.08, 0.05], [0.08, 0.95]], [[0.08, 0.05], [0.54, 0.05]], [[0.08, 0.5], [0.48, 0.5]]] },
  "G": { w: 0.74, s: [ell(0.38, 0.5, 0.30, 0.45, 55, 360, 32), [[0.68, 0.50], [0.46, 0.50]], [[0.68, 0.50], [0.68, 0.30]]] },
  "I": { w: 0.30, s: [[[0.15, 0.05], [0.15, 0.95]]] },
  "M": { w: 0.84, s: [[[0.06, 0.95], [0.06, 0.05], [0.40, 0.56], [0.74, 0.05], [0.74, 0.95]]] },
  "N": { w: 0.74, s: [[[0.08, 0.95], [0.08, 0.05], [0.66, 0.95], [0.66, 0.05]]] },
  "O": { w: 0.76, s: [ell(0.38, 0.5, 0.31, 0.45, 0, 360, 44)] },
  "R": { w: 0.68, s: [[[0.08, 0.05], [0.08, 0.95]], ell(0.08, 0.28, 0.34, 0.23, -90, 90, 18), [[0.30, 0.50], [0.62, 0.95]]] },
  "S": { w: 0.62, s: [[[0.55, 0.20], [0.46, 0.09], [0.28, 0.07], [0.13, 0.16], [0.10, 0.30], [0.20, 0.41], [0.40, 0.48], [0.54, 0.57], [0.57, 0.72], [0.47, 0.85], [0.28, 0.92], [0.12, 0.86], [0.06, 0.74]]] },
  "T": { w: 0.60, s: [[[0.05, 0.05], [0.55, 0.05]], [[0.30, 0.05], [0.30, 0.95]]] },
  "U": { w: 0.72, s: [[[0.08, 0.05], [0.08, 0.62]], ell(0.38, 0.62, 0.30, 0.30, 180, 360, 22), [[0.68, 0.62], [0.68, 0.05]]] },
  "Y": { w: 0.66, s: [[[0.06, 0.05], [0.34, 0.50]], [[0.62, 0.05], [0.34, 0.50]], [[0.34, 0.50], [0.34, 0.95]]] }
};
function drawText(str, ox, oy, size, th, col, tracking) {
  var x = ox;
  for (var k = 0; k < str.length; k++) {
    var ch = str[k];
    if (ch === " ") { x += 0.34 * size + tracking; continue; }
    var g = FONT[ch]; if (!g) { x += 0.5 * size + tracking; continue; }
    for (var si = 0; si < g.s.length; si++) { var poly = g.s[si]; for (var pi = 0; pi < poly.length - 1; pi++) line(x + poly[pi][0] * size, oy + poly[pi][1] * size, x + poly[pi + 1][0] * size, oy + poly[pi + 1][1] * size, th / 2, col); }
    x += g.w * size + tracking;
  }
  return x;
}
function textWidth(str, size, tracking) { var w = 0; for (var k = 0; k < str.length; k++) { var ch = str[k]; w += (ch === " " ? 0.34 * size : (FONT[ch] ? FONT[ch].w * size : 0.5 * size)) + tracking; } return w - tracking; }

// ----- Wordmark + sub-line -----
drawText("CRONO", 268, 96, 118, 17, TEXT, 14);
rect(270, 232, 360, 7, LIME);
drawText("RACE TIMING FOR ORGANISERS", 272, 280, 34, 6, MUTED, 7);

// ----- CTA pill -----
var ctaY = 372, ctaH = 70, ctaPad = 34;
var label = "TIME YOUR RACE";
var lblSize = 30, lblW = textWidth(label, lblSize, 6);
var ctaW = lblW + ctaPad * 2 + 54;          // room for label + arrow
rrect(270, ctaY, ctaW, ctaH, 35, LIME);
var tx = 270 + ctaPad, ty = ctaY + (ctaH - lblSize) / 2;
drawText(label, tx, ty, lblSize, 6, DARK, 6);
// arrow
var ax = tx + lblW + 22, ay = ctaY + ctaH / 2;
line(ax, ay, ax + 28, ay, 3, DARK); line(ax + 28, ay, ax + 18, ay - 10, 3, DARK); line(ax + 28, ay, ax + 18, ay + 10, 3, DARK);

rect(0, H - 9, W, 9, LIME);

// ----- Downsample (anti-alias) -----
var out = Buffer.alloc(W * H * 3);
for (var oy2 = 0; oy2 < H; oy2++) for (var ox2 = 0; ox2 < W; ox2++) {
  var r = 0, gg = 0, b = 0;
  for (var sy = 0; sy < SS; sy++) for (var sx = 0; sx < SS; sx++) { var ii = ((oy2 * SS + sy) * BW + (ox2 * SS + sx)) * 3; r += big[ii]; gg += big[ii + 1]; b += big[ii + 2]; }
  var n = SS * SS, oi = (oy2 * W + ox2) * 3; out[oi] = Math.round(r / n); out[oi + 1] = Math.round(gg / n); out[oi + 2] = Math.round(b / n);
}

// ----- Encode PNG -----
var crcTable = (function () { var t = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();
function crc32(b) { var c = 0xffffffff; for (var i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) { var len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0); var t = Buffer.from(type, "ascii"); var crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0); return Buffer.concat([len, t, data, crc]); }
var ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2;
var raw = Buffer.alloc(H * (W * 3 + 1));
for (var ry = 0; ry < H; ry++) { raw[ry * (W * 3 + 1)] = 0; out.copy(raw, ry * (W * 3 + 1) + 1, ry * W * 3, (ry + 1) * W * 3); }
var png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
fs.writeFileSync(path.join(__dirname, "..", "assets", "og-image.png"), png);
console.log("wrote assets/og-image.png (" + png.length + " bytes, " + W + "x" + H + ")");
