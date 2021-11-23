import { transform } from 'https://deno.land/x/esbuild/mod.js';

const transformationOptions: any = {
	banner: '// © Copyright Tradelite Solutions GmbH 2020-2021',
	charset: 'utf8',
	format: 'esm',
	keepNames: false,
	loader: 'ts',
	minify: true,
	outdir: `build`,
	sourcemap: false,
	target: 'es2020',
	treeShaking: true,
};

export type FileData = { content: string; mimeType: string };

const fileCche: Map<string, FileData> = new Map();

export async function getFile(filename: string): Promise<FileData> {
	if (fileCche.has(filename)) {
		const content = fileCche.get(filename);
		if (content) {
			return content;
		}
	}

	const path = `${Deno.cwd()}/src/${filename}`;
	console.log('Service filepath:', path);

	try {
		if (await fileExists(path)) {
			const output = {
				content: await Deno.readTextFile(path),
				mimeType: 'text/plain',
			};
			const extension = filename.substring(filename.lastIndexOf('.') + 1);

			console.log('File exists:', path);
			if (extension === 'html') {
				output.mimeType = 'text/html';
			} else if (extension === 'ts') {
				const transformed = await transform(
					output.content,
					transformationOptions,
				);
				output.content = transformed.code;
				output.mimeType = 'application/javascript';
			} else if (extension === 'json') {
				output.mimeType = 'application/json';
			} else if (extension === 'svg') {
				output.mimeType = 'image/svg+xml';
			} else if (extension === 'css') {
				output.mimeType = 'text/css';
			}

			fileCche.set(filename, output);

			return output;
		}
	} catch (error) {
		console.log('!!!!!!', error.message);
	}

	throw new Deno.errors.NotFound();
}

async function fileExists(path: string): Promise<boolean> {
	try {
		const stats = await Deno.lstat(path);
		return stats && stats.isFile;
	} catch (error) {
		if (error && error instanceof Deno.errors.NotFound) {
			return false;
		}
		throw error;
	}
}
