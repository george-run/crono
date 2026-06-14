/* One-off generator for assets/qr-crono.svg — a fixed QR code for https://crono.run,
   printed on each race bib to promote Crono. Zero-dependency byte-mode QR encoder
   (adapted from Kazuhiko Arase's qrcode-generator, MIT). Not part of the build/runtime:
   the app ships only the resulting SVG. Re-run with `node tools/make-qr.cjs` if the URL
   ever changes. NOTE: a QR is correctness-critical and can't be scan-tested here — verify
   the generated SVG with a phone before relying on it.

   Usage: node tools/make-qr.cjs            (writes assets/qr-crono.svg) */
"use strict";
var fs = require("fs");
var path = require("path");

var URL = "https://crono.run";
var ECLEVEL = "M"; // L/M/Q/H — M ≈ 15% recovery, robust enough for print

// ----- Galois field math (GF(256), primitive 0x11d) -----
var EXP = [], LOG = [];
(function () {
  for (var i = 0; i < 8; i++) EXP[i] = 1 << i;
  for (i = 8; i < 256; i++) EXP[i] = EXP[i - 4] ^ EXP[i - 5] ^ EXP[i - 6] ^ EXP[i - 8];
  for (i = 0; i < 255; i++) LOG[EXP[i]] = i;
})();
function glog(n) { if (n < 1) throw new Error("glog(" + n + ")"); return LOG[n]; }
function gexp(n) { while (n < 0) n += 255; while (n >= 256) n -= 255; return EXP[n]; }

// ----- polynomial -----
function Poly(num, shift) {
  var offset = 0;
  while (offset < num.length && num[offset] === 0) offset++;
  this.num = [];
  for (var i = 0; i < num.length - offset + shift; i++) this.num[i] = (i < num.length - offset) ? num[i + offset] : 0;
}
Poly.prototype.get = function (i) { return this.num[i]; };
Poly.prototype.len = function () { return this.num.length; };
Poly.prototype.multiply = function (e) {
  var num = []; for (var i = 0; i < this.len() + e.len() - 1; i++) num[i] = 0;
  for (i = 0; i < this.len(); i++) for (var j = 0; j < e.len(); j++)
    num[i + j] ^= gexp(glog(this.get(i)) + glog(e.get(j)));
  return new Poly(num, 0);
};
Poly.prototype.mod = function (e) {
  if (this.len() - e.len() < 0) return this;
  var ratio = glog(this.get(0)) - glog(e.get(0));
  var num = []; for (var i = 0; i < this.len(); i++) num[i] = this.get(i);
  for (i = 0; i < e.len(); i++) num[i] ^= gexp(glog(e.get(i)) + ratio);
  return new Poly(num, 0).mod(e);
};
function ecPolynomial(ec) {
  var a = new Poly([1], 0);
  for (var i = 0; i < ec; i++) a = a.multiply(new Poly([1, gexp(i)], 0));
  return a;
}

// ----- RS block tables (byte mode), versions 1–6, all ECC levels -----
// each row: groups of [blockCount, totalCodewords, dataCodewords]
var RS = {
  L: { 1: [[1,26,19]], 2: [[1,44,34]], 3: [[1,70,55]], 4: [[1,100,80]], 5: [[1,134,108]], 6: [[2,86,68]] },
  M: { 1: [[1,26,16]], 2: [[1,44,28]], 3: [[1,70,44]], 4: [[2,50,32]], 5: [[2,67,43]], 6: [[4,43,27]] },
  Q: { 1: [[1,26,13]], 2: [[1,44,22]], 3: [[2,35,17]], 4: [[2,50,24]], 5: [[2,33,15],[2,34,16]], 6: [[4,43,19]] },
  H: { 1: [[1,26,9]],  2: [[1,44,16]], 3: [[2,35,13]], 4: [[4,25,9]],  5: [[2,33,11],[2,34,12]], 6: [[4,43,15]] }
};
var ECBITS = { L: 1, M: 0, Q: 3, H: 2 }; // format-info 2-bit codes

// ----- bit buffer -----
function Bits() { this.buf = []; this.length = 0; }
Bits.prototype.putBit = function (bit) {
  var i = Math.floor(this.length / 8);
  if (this.buf.length <= i) this.buf.push(0);
  if (bit) this.buf[i] |= (0x80 >>> (this.length % 8));
  this.length++;
};
Bits.prototype.put = function (num, len) { for (var i = 0; i < len; i++) this.putBit(((num >>> (len - 1 - i)) & 1) === 1); };

function pickVersion(level, byteLen) {
  for (var v = 1; v <= 6; v++) {
    var groups = RS[level][v], data = 0;
    for (var g = 0; g < groups.length; g++) data += groups[g][0] * groups[g][2];
    // mode(4) + count(8) + data*8 + terminator fits?
    if (4 + 8 + byteLen * 8 <= data * 8) return v;
  }
  throw new Error("URL too long for v1–6");
}

function createBytes(version, level, dataBytes) {
  var groups = RS[level][version];
  var blocks = [];
  groups.forEach(function (g) {
    for (var k = 0; k < g[0]; k++) blocks.push({ total: g[1], data: g[2] });
  });
  var totalData = blocks.reduce(function (s, b) { return s + b.data; }, 0);

  var bits = new Bits();
  bits.put(4, 4);                 // byte mode
  bits.put(dataBytes.length, 8);  // count (versions 1–9)
  for (var i = 0; i < dataBytes.length; i++) bits.put(dataBytes[i], 8);
  if (bits.length + 4 <= totalData * 8) bits.put(0, 4);          // terminator
  while (bits.length % 8 !== 0) bits.putBit(false);              // byte align
  var pads = [0xEC, 0x11], pi = 0;
  while (bits.buf.length < totalData) { bits.buf.push(pads[pi % 2]); pi++; }

  // split into data blocks, compute EC per block
  var dcdata = [], ecdata = [], off = 0, maxDc = 0, maxEc = 0;
  blocks.forEach(function (b) {
    var ecCount = b.total - b.data;
    var dc = bits.buf.slice(off, off + b.data); off += b.data;
    dcdata.push(dc); maxDc = Math.max(maxDc, dc.length);
    var rsPoly = ecPolynomial(ecCount);
    var raw = new Poly(dc, rsPoly.len() - 1);
    var mod = raw.mod(rsPoly);
    var ec = []; for (var k = 0; k < rsPoly.len() - 1; k++) { var idx = k + mod.len() - (rsPoly.len() - 1); ec[k] = (idx >= 0) ? mod.get(idx) : 0; }
    ecdata.push(ec); maxEc = Math.max(maxEc, ec.length);
  });

  var out = [];
  for (i = 0; i < maxDc; i++) for (var b = 0; b < dcdata.length; b++) if (i < dcdata[b].length) out.push(dcdata[b][i]);
  for (i = 0; i < maxEc; i++) for (b = 0; b < ecdata.length; b++) if (i < ecdata[b].length) out.push(ecdata[b][i]);
  return out;
}

// ----- module matrix -----
function makeMatrix(version, level, data, mask) {
  var size = version * 4 + 17;
  var m = []; for (var r = 0; r < size; r++) { m[r] = []; for (var c = 0; c < size; c++) m[r][c] = null; }

  function probe(row, col) {
    for (var r = -1; r <= 7; r++) for (var c = -1; c <= 7; c++) {
      if (row + r < 0 || row + r >= size || col + c < 0 || col + c >= size) continue;
      m[row + r][col + c] = (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
        (0 <= c && c <= 6 && (r === 0 || r === 6)) || (2 <= r && r <= 4 && 2 <= c && c <= 4);
    }
  }
  probe(0, 0); probe(size - 7, 0); probe(0, size - 7);

  // timing
  for (var i = 8; i < size - 8; i++) { if (m[6][i] === null) m[6][i] = (i % 2 === 0); if (m[i][6] === null) m[i][6] = (i % 2 === 0); }

  // alignment (single centre for v2–6; positions per version)
  var ALIGN = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34] }[version];
  for (i = 0; i < ALIGN.length; i++) for (var j = 0; j < ALIGN.length; j++) {
    var ar = ALIGN[i], ac = ALIGN[j];
    if (m[ar][ac] !== null) continue; // overlaps a finder
    for (r = -2; r <= 2; r++) for (c = -2; c <= 2; c++)
      m[ar + r][ac + c] = (Math.max(Math.abs(r), Math.abs(c)) !== 1);
  }

  // format info (level + mask), 15 bits with BCH + mask 0x5412
  var fmt = (ECBITS[level] << 3) | mask;
  var bch = fmt << 10;
  for (i = 0; bchDigit(bch) - bchDigit(0x537) >= 0; ) { bch ^= (0x537 << (bchDigit(bch) - bchDigit(0x537))); }
  var fmtBits = ((fmt << 10) | bch) ^ 0x5412;
  for (i = 0; i < 15; i++) {
    var bit = ((fmtBits >> i) & 1) === 1;
    if (i < 6) m[i][8] = bit; else if (i < 8) m[i + 1][8] = bit; else m[size - 15 + i][8] = bit;
    if (i < 8) m[8][size - i - 1] = bit; else if (i < 9) m[8][15 - i - 1 + 1] = bit; else m[8][15 - i - 1] = bit;
  }
  m[size - 8][8] = true; // dark module

  // data with mask
  var maskFn = [
    function (r, c) { return (r + c) % 2 === 0; },
    function (r, c) { return r % 2 === 0; },
    function (r, c) { return c % 3 === 0; },
    function (r, c) { return (r + c) % 3 === 0; },
    function (r, c) { return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0; },
    function (r, c) { return (r * c) % 2 + (r * c) % 3 === 0; },
    function (r, c) { return ((r * c) % 2 + (r * c) % 3) % 2 === 0; },
    function (r, c) { return ((r + c) % 2 + (r * c) % 3) % 2 === 0; }
  ][mask];

  var bitIndex = 0, dir = -1, row = size - 1;
  for (var col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    while (true) {
      for (var cc = 0; cc < 2; cc++) {
        var cx = col - cc;
        if (m[row][cx] === null) {
          var dark = false;
          if (bitIndex < data.length * 8) dark = ((data[Math.floor(bitIndex / 8)] >>> (7 - (bitIndex % 8))) & 1) === 1;
          if (maskFn(row, cx)) dark = !dark;
          m[row][cx] = dark; bitIndex++;
        }
      }
      row += dir;
      if (row < 0 || row >= size) { row -= dir; dir = -dir; break; }
    }
  }
  return m;
}
function bchDigit(d) { var n = 0; while (d !== 0) { n++; d >>>= 1; } return n; }

function penalty(m) {
  var size = m.length, p = 0, r, c, i;
  for (r = 0; r < size; r++) for (c = 0; c < size; c++) {
    var same = 0, dark = m[r][c];
    for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      var rr = r + dr, cc = c + dc;
      if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
      if (m[rr][cc] === dark) same++;
    }
    if (same > 5) p += 3 + (same - 5);
  }
  for (r = 0; r < size - 1; r++) for (c = 0; c < size - 1; c++) {
    var d = 0; if (m[r][c]) d++; if (m[r + 1][c]) d++; if (m[r][c + 1]) d++; if (m[r + 1][c + 1]) d++;
    if (d === 0 || d === 4) p += 3;
  }
  var dark2 = 0; for (r = 0; r < size; r++) for (c = 0; c < size; c++) if (m[r][c]) dark2++;
  var ratio = Math.abs(100 * dark2 / (size * size) - 50) / 5;
  p += Math.floor(ratio) * 10;
  return p;
}

function build() {
  var bytes = []; for (var i = 0; i < URL.length; i++) bytes.push(URL.charCodeAt(i));
  var version = pickVersion(ECLEVEL, bytes.length);
  var data = createBytes(version, ECLEVEL, bytes);
  var best = null, bestP = Infinity;
  for (var mask = 0; mask < 8; mask++) {
    var m = makeMatrix(version, ECLEVEL, data, mask);
    var p = penalty(m);
    if (p < bestP) { bestP = p; best = m; }
  }
  return best;
}

function toSvg(m) {
  var size = m.length, quiet = 4, dim = size + quiet * 2, d = "";
  for (var r = 0; r < size; r++) for (var c = 0; c < size; c++) if (m[r][c]) d += "M" + (c + quiet) + "," + (r + quiet) + "h1v1h-1z";
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + dim + ' ' + dim + '" shape-rendering="crispEdges" role="img" aria-label="' + URL + '">' +
    '<rect width="' + dim + '" height="' + dim + '" fill="#fff"/>' +
    '<path d="' + d + '" fill="#000"/></svg>\n';
}

var matrix = build();
var svg = toSvg(matrix);
fs.writeFileSync(path.join(__dirname, "..", "assets", "qr-crono.svg"), svg);
console.log("wrote assets/qr-crono.svg — " + matrix.length + "x" + matrix.length + " modules for " + URL + " (" + svg.length + " bytes)");
