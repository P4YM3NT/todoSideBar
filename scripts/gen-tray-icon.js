#!/usr/bin/env node
const fs = require('fs');
const zlib = require('zlib');

const W = 22;
const H = 22;
const pixels = new Uint8Array(W * H * 4);

function setPixel(x, y, alpha) {
	if (x < 0 || x >= W || y < 0 || y >= H) return;
	const i = (y * W + x) * 4;
	pixels[i] = 255;
	pixels[i + 1] = 255;
	pixels[i + 2] = 255;
	pixels[i + 3] = Math.max(pixels[i + 3], alpha);
}

function brush(x, y) {
	for (let oy = -1; oy <= 1; oy++) {
		for (let ox = -1; ox <= 1; ox++) {
			const distance = Math.abs(ox) + Math.abs(oy);
			setPixel(x + ox, y + oy, distance === 2 ? 120 : 255);
		}
	}
}

function line(x0, y0, x1, y1) {
	const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		const x = Math.round(x0 + (x1 - x0) * t);
		const y = Math.round(y0 + (y1 - y0) * t);
		brush(x, y);
	}
}

line(4, 11, 8, 16);
line(8, 16, 18, 6);

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
ihdr.writeUInt8(8, 8); ihdr.writeUInt8(6, 9);

const png = Buffer.concat([
	Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
	chunk('IHDR', ihdr),
	chunk('IDAT', compressed),
	chunk('IEND', Buffer.alloc(0)),
]);

fs.mkdirSync('./resources', { recursive: true });
fs.writeFileSync('./resources/tray-icon.png', png);
process.stdout.write('Generated resources/tray-icon.png (' + png.length + ' bytes)\n');
