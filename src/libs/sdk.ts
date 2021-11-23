const SDK_VERSION = 'UnitySDK-2021-10';

type PlatformData = {
	action: 'user-token' | 'session-invalidation';
	token?: string;
};

type GameConfiguration = {
	// Entity status
	sdkVersion: string;
	status: 'active' | 'suspended' | 'ended' | 'unavailable';
	debugInfo?: string;

	// Configuration attributes
	id: string;
	type?: string;
	titleId?: string;
	logoUrl?: string;
};

type UnityInstance = {
	SendMessage: (
		objectName: string,
		methodName: string,
		data: undefined | string | number,
	) => void;
};

let platformToken: string | undefined = undefined;
let tradeliteToken: string | undefined = undefined;
let unityInstance: UnityInstance;

const thisModuleUrl = new URL(import.meta.url);
const platformBaseURL = thisModuleUrl.searchParams.get('platformBaseUrl') ||
	'https://localhost:8888';
const declareForUnity =
	thisModuleUrl.searchParams.get('declareForUnity') === 'true';

function registerMessageHandler(): void {
	globalThis.addEventListener('message', (event: MessageEventInit): void => {
		// Access control
		if (event.origin !== 'https://der-acktionar.de') {
			return;
		}

		const platformData = event.data as PlatformData;
		if (platformData.action === 'user-token') {
			platformToken = platformData.token;
		}

		// TODO: check the token validity
	}, false);
}

export async function getGameConfiguration(
	gameId: string,
): Promise<GameConfiguration> {
	// TODO: remove this hack...
	if (4 % 2 === 0) {
		return {
			sdkVersion: SDK_VERSION,
			status: 'active',
			id: gameId,
		};
	}

	const serviceUrl = `${platformBaseURL}/api/v1/GameConfig/${gameId}`;

	const response = await fetch(serviceUrl);

	const status = response.status;
	const contentType = response.headers.get('content-type');

	if (status === 200 && contentType === 'application/json') {
		return response.json();
	}

	return {
		id: gameId,
		status: 'unavailable',
		debugInfo:
			`Unexpected HTTP status: ${status}!\nMIME type: ${contentType}\nPayload: ${await response
				.text()}`,
		sdkVersion: SDK_VERSION,
	};
}

export async function logInWithCredentials(
	username: string,
	password: string,
): Promise<boolean> {
	const serviceUrl = `${platformBaseURL}/api/v1/OAuth/`;

	const response = await fetch(serviceUrl, {
		method: 'POST',
		body: JSON.stringify({ mode: 'credentials', username, password }),
	});

	const status = response.status;
	const contentType = response.headers.get('content-type');

	if (status === 200 && contentType === 'application/json') {
		tradeliteToken = await response.json();
		return true;
	}

	return false;
}

export async function logInWithPlatformToken(): Promise<boolean> {
	if (platformToken === undefined) {
		return false;
	}

	const serviceUrl = `${platformBaseURL}/api/v1/OAuth/`;

	const response = await fetch(serviceUrl, {
		method: 'POST',
		body: JSON.stringify({ mode: 'withPlatformToken', platformToken }),
	});

	const status = response.status;
	const contentType = response.headers.get('content-type');

	if (status === 200 && contentType === 'application/json') {
		tradeliteToken = await response.json();
		return true;
	}

	return false;
}

registerMessageHandler();

declare global {
	// @ts-ignore Use of Generic function b/c all of them cannot be just listed...
	var TradeliteSDK: { [key: string]: (...args) => void };
}

if (declareForUnity) {
	if (globalThis.TradeliteSDK === undefined) {
		globalThis.TradeliteSDK = {};
	}

	globalThis.TradeliteSDK = {
		registerUnityInstance: function (instance: UnityInstance): void {
			unityInstance = instance;
		},
		getGameConfiguration: function (
			gameId: string,
			objectName: string,
			methodName: string,
		): void {
			getGameConfiguration(gameId).then((gameConfig) =>
				unityInstance.SendMessage(
					objectName,
					methodName,
					JSON.stringify(gameConfig),
				)
			);
		},
		logInWithCredentials: function (
			username: string,
			password: string,
			objectName: string,
			methodName: string,
		): void {
			logInWithCredentials(username, password).then((status) =>
				unityInstance.SendMessage(
					objectName,
					methodName,
					status ? 1 : 0,
				)
			);
		},
		logInWithPlatformToken: function (
			objectName: string,
			methodName: string,
		): void {
			logInWithPlatformToken().then((status) =>
				unityInstance.SendMessage(
					objectName,
					methodName,
					status ? 1 : 0,
				)
			);
		},
	};

	console.log(
		'Note: Tradelite SDK is now part of the global namespace, ready for use by its Unity connector.',
	);
}
