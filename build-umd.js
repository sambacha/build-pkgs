// @ts-check
const fs = require('fs');
const zlib = require('zlib');
const { minify } = require('terser');
const pkg = require('../package.json');

if (!fs.existsSync('dist')) fs.mkdirSync('dist');

/**
 * @param {string} file
 * @param {string} source
 */
function write(file, source) {
	let isModule = !source.startsWith('!function');
	let result = minify(source, {
		module: isModule,
		compress: true,
	});

	fs.writeFileSync(file, result.code);
	console.log('~> "%s" (%d b)', file, zlib.gzipSync(result.code).byteLength);
}

let input = fs.readFileSync('src/index.js', 'utf8');

// copy for ESM
write(pkg.module, input);

// transform ESM -> CJS exports
write(pkg.main, input.replace('export function', 'function').replace(
	'export default `${APP_NAME}`;',
	'module.exports = `${APP_NAME}`;\n'
	+ 'module.exports.`${APP_NAME}` = `${APP_NAME}`;'
));

// transform ESM -> UMD exports
input = input.replace('export function', 'function').replace('export default `${APP_NAME}`;', 'return `${APP_NAME}`.`${APP_NAME}`=`${APP_NAME}`, `${APP_NAME}`;');
write(pkg.unpkg, '!function(global,factory){"object"==typeof exports&&"undefined"!=typeof module?module.exports=factory():"function"==typeof define&&define.amd?define(factory):global.`${APP_NAME}`=factory()}(this,function(){' + input + '});');