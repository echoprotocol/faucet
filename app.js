const appname = 'echofaucet';
const {default: echo, constants, PrivateKey} = require('echojs-lib');

const conf = require('rc')(appname, {
	account: {
		id: "",
		privateKey: "",
	},
	amount: {
		asset_id: '1.3.0',
		amount: 5000000000
	},
	echo_url: '',
});

const options = {
	connectionTimeout: 5000,
	maxRetries: 5,
	pingTimeout: 3000,
	pingInterval: 3000,
	debug: false,
	apis: [
		'database', 'network_broadcast', 'history', 'registration', 'asset', 'login', 'network_node'
	]
};

process.on('unhandledRejection', (reason, p) => {
	console.log('Unhandled Rejection at:', p, 'reason:', reason);
	// Application specific logging, throwing an error, or other logic here
	setTimeout(() => {
		process.exit(1);
	}, 2000);
});

class Faucet {
	constructor() {
		this.count = 0;
		this.connect();
	}

	async connect() {
		console.log(`Connect url: ${conf.echo_url}`);
		try {
			await echo.connect(conf.echo_url, options);
		} catch (e) {

		}
		this.count = await echo.api.getAccountCount();
		await echo.subscriber.setBlockApplySubscribe(this.applyBlock.bind(this));
		echo.subscriber.setStatusSubscribe('connect', () => {
			console.log('Connected');
		});
		echo.subscriber.setStatusSubscribe('disconnect', this.onDisconnect.bind(this));
	}

	applyBlock(block) {
		// fix for blockchain bug
		setTimeout(() => {
			this.checkLastBlock();
		}, 1000);
	}

	async checkLastBlock() {
		const count = await echo.api.getAccountCount();
		console.log(`accounts count:`, count);
		const prevCount = this.count;
		this.count = count;
		for (let i = prevCount; i < count; i++) {
			try {
				await this.transfer(`1.2.${count - 1}`);
			} catch (e) {
				console.error('transfer error');
				console.error(e);
				process.exit(1);
			}
		}
	}

	async transfer(to) {
		const tx = echo.createTransaction();

		const options = {
			to,
			from: conf.account.id,
			amount: conf.amount,
		};

		tx.addOperation(constants.OPERATIONS_IDS.TRANSFER, options);

		tx.addSigner(PrivateKey.fromWif(conf.account.privateKey));
		await tx.sign();
		await tx.broadcast(() => console.log('was broadcasted'));
	}

	onDisconnect() {
		console.log('Disconnect');
		process.exit(1);
	}
}

new Faucet();
