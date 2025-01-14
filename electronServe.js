const path = require("path");
const { app, protocol } = require("electron");

function electronServe(options) {
	options = {
		isCorsEnabled: true,
		scheme: 'app',
		hostname: '-',
		file: 'index',
		...options,
	};

	if (!options.directory) {
		throw new Error('The `directory` option is required');
	}

	options.directory = path.resolve(app.getAppPath(), options.directory);

	

	protocol.registerSchemesAsPrivileged([
		{
			scheme: options.scheme,
			privileges: {
				standard: true,
				secure: true,
				allowServiceWorkers: true,
				supportFetchAPI: true,
				corsEnabled: options.isCorsEnabled,
			},
		},
	]);

	return async (window_, searchParameters) => {
		const queryString = searchParameters ? '?' + new URLSearchParams(searchParameters).toString() : '';
		await window_.loadURL(`${options.scheme}://${options.hostname}${queryString}`);
	};
}

module.exports = electronServe;