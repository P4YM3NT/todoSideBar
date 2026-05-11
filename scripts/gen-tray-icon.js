#!/usr/bin/env node
// Generates resources/tray-icon.png — a 22x22 white checkmark on transparent background.
// Suitable as a macOS template image (OS adapts color to menu bar theme).
const fs = require('fs');
const zlib = require('zlib');

const W = 22;
const H = 22;
const pixels = new Uint8Array(W * H * 4); // RGBA

function setPixel(x, y, a) {
	if (x < 0 || x >= W || y < 0 || y >= H) return;
	const i = (y * W + x) * 4;
	pixels[i] = 255;
	pixels[i + 1] = 255;
	pixels[i + 2] = 255;
	pixels[i + 3] = a;
}

// Anti-aliased line via Wu's algorithm
function line(x0, y0, x1, y1) {
	const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
	const steep = dy > dx;
	if (steep) { [x0, y0] = [y0, x0]; [x1, y1] = [y1, x1]; }
	if (x0 > x1) { [x0, x1] = [x1, x0]; [y0, y1] = [y1, y0]; }
	const gradient = dx === 0 ? 1 : (y1 - y0) / (x1 - x0);
	let y = y0;
	for (let x = x0; x <= x1; x++) {
		const frac = y - Math.floor(y);
		const a1 = Math.round((1 - frac) * 255);
		const a2 = Math.round(frac * 255);
		if (steep) {
			setPixel(Math.floor(y), x, a1);
			setPixel(Math.floor(y) + 1, x, a2);
		} else {
			setPixel(x, Math.floor(y), a1);
			setPixel(x, Math.floor(y) + 1, a2);
		}
		y += gradient;
	}
}

// Thick line by drawing multiple parallel offsets
function thickLine(x0, y0, x1, y1, t) {
	const dx = x1 - x0, dy = y1 - y0;
	const len = Math.sqrt(dx * dx + dy * dy);
	const nx = -dy / len, ny = dx / len;
	for (let k = -t; k <= t; k++) {
		line(x0 + nx * k, y0 + ny * k, x1 + nx * k, y1 + ny * k);
	}
}

// Draw a checkmark: short leg + long leg
thickLine(3, 11, 8, 17, 1.5);
thickLine(8, 17, 19, 5, 1.5);

// Build raw PNG scanlines (filter type 0 per row)
const raw = [];
for (let y = 0; y < H; y++) {
	raw.push(0);
	for (let x = 0; x < W; x++) {
		const i = (y * W + x) * 4;
		raw.push(pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]);
	}
}

const compressed = zlib.deflateSync(Buffer.from(raw));

function crc32(buf) {
	let c = 0xFFFFFFFF;
	for (const b of buf) { c ^= b; for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); }
	return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
	const b = Buffer.alloc(data.length + 12);
	b.writeUInt32BE(data.length, 0);
	b.write(type, 4, 'ascii');
	data.copy(b, 8);
	b.writeUInt32BE(crc32(b.slice(4, 8 + data.length)), 8 + data.length);
	return b;
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr.writeUInt8(8, 8); ihdr.writeUInt8(6, 9); // bit depth 8, RGBA

const png = Buffer.concat([
	Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
	chunk('IHDR', ihdr),
	chunk('IDAT', compressed),
	chunk('IEND', Buffer.alloc(0)),
]);

fs.mkdirSync('./resources', { recursive: true });
fs.writeFileSync('./resources/tray-icon.png', png);
console.log('Generated resources/tray-icon.png (' + png.length + ' bytes)');
