import { Application, Router } from 'https://deno.land/x/oak/mod.ts';
import * as log from 'https://deno.land/std/log/mod.ts';
import { oakCors } from 'https://deno.land/x/cors/mod.ts';

import { getFile } from './serve-local-files.ts';

const router = new Router();

router.get('/(.*)', async (context) => {
	try {
		if (context.params && context.params[0]?.startsWith('/server')) {
			context.response.status = 401;
		} else {
			const fileData = await getFile(context.params[0] || 'index.html');
			context.response.headers.set('Content-Type', fileData.mimeType);
			context.response.body = fileData.content;
		}
	} catch (error) {
		context.response.status = 404;
	}
});

interface State {
	tradeliteToken: string;
	platformToken?: string;
	platformId?: string;
	gameId?: string;
}

const app = new Application<State>();

app.addEventListener('error', (event) => {
	log.error(event.error);
});

app.use(async (ctx, next) => {
	try {
		await next();
	} catch (error) {
		ctx.response.body = 'Internal server error';
		throw error;
	}
});

app.use(
	oakCors({
		origin: /^.+localhost:\d+$/,
		methods: 'GET',
		allowedHeaders: [
			'Content-Type',
			'Authorization',
			'X-Tradelite-Platform-Token',
		],
		exposedHeaders: ['Content-Range', 'Location'],
		credentials: true,
		preflightContinue: true,
	}),
);

app.use(router.routes());
app.use(router.allowedMethods());

const PORT = 8181;

if (import.meta.main) {
	log.info(`Starting server on port ${PORT}...`);
	await app.listen({
		port: PORT,
	});
}
