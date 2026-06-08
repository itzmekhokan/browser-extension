#!/usr/bin/env node
/**
 * Renders the W-mark SVG variants to the PNG icon sets the manifest expects.
 *
 *   icons/src/wmark.svg          → icons/icon-{16,32,48,128}.png
 *   icons/src/wmark-active.svg   → icons/icon-{16,32}-active.png
 *   icons/src/wmark-inactive.svg → icons/icon-{16,32}-inactive.png
 *
 * One full-color set (WP-blue / dark-slate circle, white W) ships to both
 * Chrome and Safari. Safari template-renders a toolbar icon ONLY when it
 * reads as monochrome (a black/grayscale shape on transparency): it tints
 * the alpha shape with the system color and drops the icon's own colors.
 * An icon carrying genuine color is rendered as-is — this is the opt-out
 * extensions like 1Password rely on. So every state uses a clearly
 * saturated fill (note the dark states are slate `#2c3e50`, not a near-gray,
 * which Safari could still flatten to a tinted blob). This keeps the three
 * states distinct in Safari and gives both browsers one identical icon.
 *
 * Run with: node scripts/render-icons.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');

const jobs = [
	{ svg: 'wmark.svg',          sizes: [16, 32, 48, 128], suffix: '' },
	{ svg: 'wmark-active.svg',   sizes: [16, 32],          suffix: '-active' },
	{ svg: 'wmark-inactive.svg', sizes: [16, 32],          suffix: '-inactive' },
];

async function renderSet({ srcDir, outDir }) {
	fs.mkdirSync(outDir, { recursive: true });
	for (const { svg, sizes, suffix } of jobs) {
		const buf = fs.readFileSync(path.join(srcDir, svg));
		for (const size of sizes) {
			const out = path.join(outDir, `icon-${size}${suffix}.png`);
			await sharp(buf, { density: 384 })
				.resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
				.png({ compressionLevel: 9 })
				.toFile(out);
			console.log('  →', path.relative(ROOT, out));
		}
	}
}

(async () => {
	await renderSet({
		srcDir: path.join(ROOT, 'icons', 'src'),
		outDir: path.join(ROOT, 'icons'),
	});
})();
