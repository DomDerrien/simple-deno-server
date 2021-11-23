async function forwardRequest(
	connection: Deno.Conn,
	remoteServerName: string,
	remoteServerPort: number,
): Promise<void> {
	const httpConnection: Deno.HttpConn = Deno.serveHttp(connection);
	for await (const requestEvent of httpConnection) {
		const pathname: string = new URL(requestEvent.request.url).pathname;
		console.log('Serving request for:', pathname);
		const requestToRemote: Promise<Response> = fetch(
			`http://${remoteServerName}:${remoteServerPort}${pathname}`,
		);
		requestEvent.respondWith(await requestToRemote);
	}
}

export async function main(
	localServerPort: number,
	remoteServerName: string,
	remoteServerPort: number,
): Promise<void> {
	const server: Deno.Listener = Deno.listen({ port: localServerPort });
	console.log(`HTTP server listening on port: ${localServerPort}`);

	for await (const connection of server) {
		forwardRequest(connection, remoteServerName, remoteServerPort);
	}
}

const argNb: number = Deno.args.length;
if (argNb !== 3) {
	console.log(`Usage:
    1. localServerPort
    2. remoteServerName
    3. remoteServerPort
    `);
} else {
	const localServerPort = parseInt(Deno.args[0], 10);
	const remoteServerName = Deno.args[1];
	const remoteServerPort = parseInt(Deno.args[2], 10);
	main(localServerPort, remoteServerName, remoteServerPort);
}
