import { Application, Router } from 'https://deno.land/x/oak/mod.ts';
import * as log from 'https://deno.land/std/log/mod.ts';
import { oakCors } from 'https://deno.land/x/cors/mod.ts';

import { getFile } from './serve-local-files.ts';

const router = new Router();

router.get('/(.*)', async (context) => {
	try {
		const path = context.params[0] || 'index.html';
		if (context.params && path.startsWith('server')) {
			context.response.status = 401;
			return;
		}
		const token = context.request.headers.get('Authorization');
		if (!path.startsWith('api-mocks/v1/game-config') && (!token || !token.startsWith('Bearer '))) {
			context.response.status = 401;
			return;
		}
		const fileData = await getFile(path);
		context.response.headers.set('Content-Type', fileData.mimeType);
		context.response.body = fileData.content;
	} catch (error) {
		console.log('Cannot process GET request for: ', context.params[0], 'with', error.message);
		context.response.status = 404;
	}
});
router.post('/(.*)', async (context) => {
	try {
		const path = context.params[0] || 'index.html';
		if (context.params && path.startsWith('server')) {
			context.response.status = 401;
			return;
		}
		if (path === 'api-mocks/v1/auth.txt') {
			const payload = await context.request.body({ type: 'json' }).value;
			if (payload.username === payload.password) {
				const fileData = await getFile(path);
				context.response.headers.set('Content-Type', 'text/plain');
				context.response.body = fileData.content;
				context.response.status = 200;
			} else {
				context.response.status = 401;
			}
			return;
		}
		const fileData = await getFile(path);
		context.response.headers.set('Content-Type', 'text/plain');
		context.response.headers.set('Location', fileData.content);
		context.response.status = 201;
	} catch (error) {
		console.log('Cannot process POST request for: ', context.params[0], 'with', error.message);
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
