import log from 'electron-log/main';

log.initialize();

log.transports.file.level = process.env['NODE_ENV'] === 'development' ? 'debug' : 'warn';
log.transports.file.maxSize = 10 * 1024 * 1024;
log.transports.console.level = 'debug';

log.errorHandler.startCatching({
	showDialog: false,
	onError: ({ error }) => {
		log.error('Uncaught error:', error);
	},
});

export default log;
