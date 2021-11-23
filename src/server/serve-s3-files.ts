import {
	GetObjectResponse,
	S3Bucket,
	S3Object,
} from 'https://deno.land/x/s3@0.4.1/mod.ts';

function setHeader(
	key: string,
	objectResponse: GetObjectResponse,
	headers: Headers,
): void {
	const keyParts: string[] = key.split('-');
	keyParts[0] = keyParts[0].toLowerCase();
	// @ts-ignore
	const value: string = '' + (objectResponse[keyParts.join('')] || '');
	if (0 < value.length) {
		headers.set(key, value);
	}
}

async function forwardRequest(
	connection: Deno.Conn,
	bucket: S3Bucket,
): Promise<void> {
	const httpConnection: Deno.HttpConn = Deno.serveHttp(connection);

	for await (const requestEvent of httpConnection) {
		const pathname = new URL(requestEvent.request.url).pathname;
		const objectResponse: GetObjectResponse | undefined = await bucket
			.getObject(pathname);

		if (objectResponse === undefined) {
			requestEvent.respondWith(
				new Response('Not found', { status: 404 }),
			);
		} else {
			const headers = new Headers();
			setHeader('Cache-Control', objectResponse, headers);
			setHeader('Content-Disposition', objectResponse, headers);
			setHeader('Content-Encoding', objectResponse, headers);
			setHeader('Content-Language', objectResponse, headers);
			setHeader('Content-Length', objectResponse, headers);
			setHeader('Content-Type', objectResponse, headers);
			setHeader('ETag', objectResponse, headers);
			setHeader('Expires', objectResponse, headers);
			setHeader('Last-Modified', objectResponse, headers);
			setHeader('Storage-Class', objectResponse, headers);
			setHeader('Replication-Status', objectResponse, headers);
			setHeader('Tagging-Count', objectResponse, headers);
			setHeader('Version-Id', objectResponse, headers);
			requestEvent.respondWith(
				new Response(objectResponse.body, { status: 200, headers }),
			);
		}
	}
}

async function main(
	localServerPort: number,
	remoteServerName: string,
): Promise<void> {
	const awsSetup = {
		accessKeyID: Deno.env.get('AWS_ACCESS_KEY') || '',
		secretKey: Deno.env.get('AWS_SECRET_KEY') || '',
		bucket: remoteServerName,
		region: 'us-east-1',
		// endpointURL: Deno.env.get('S3_ENDPOINT_URL'),
	};
	const bucket = new S3Bucket(awsSetup);

	const server: Deno.Listener = Deno.listen({ port: localServerPort });
	console.log(`Listening on port: ${localServerPort}`);

	for await (const connection of server) {
		forwardRequest(connection, bucket);
	}
}

const argNb: number = Deno.args.length;
if (argNb !== 2) {
	console.log(`usage:
  1. localServerPort
  2. s3BucketName
  `);
} else {
	const localServerPort = parseInt(Deno.args[0], 10);
	const s3BucketName = Deno.args[1];
	main(localServerPort, s3BucketName);
}
