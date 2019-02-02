const appname = 'echofaucet';
const echo = require('echojs-lib');

const conf = require('rc')(appname, {
    account: {
        id: "",
        privateKey: "",
    },
    amount: {
        asset_id: '1.3.0',
        amount: 100000000
    },
    echo_url: 'ws://195.201.164.54:6311',
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

   
class Faucet {
    constructor() {
        this.connection = null;
        this.count = 0;
        this.connect()
    }

    async connect() {
        this.connection = new echo.Echo();
        await this.connection.connect(conf.echo_url, options);
        this.count = await this.connection.api.getAccountCount();
        await this.connection.subscriber.setBlockApplySubscribe(this.applyBlock.bind(this));
    }

    applyBlock(block) {
        this.checkLastBlock();
    }

    async checkLastBlock() {
        const count = await this.connection.api.getAccountCount();
        const prevCount = this.count;
        this.count = count;
        for(let i = prevCount; i < count; i++) {
            try {
                await this.transfer(`1.2.${count - 1}`)
            } catch(e) {
                console.error(e);
            }
        }
    }

    async transfer(to) {
        const tx = this.connection.createTransaction();
    
        const options = {
            to,
            from: conf.account.id,
            amount: conf.amount,
        };

        tx.addOperation(echo.constants.OPERATIONS_IDS.TRANSFER, options);

        tx.addSigner(echo.PrivateKey.fromWif(conf.account.privateKey));
        await tx.sign();
        await tx.broadcast(() => console.log('was broadcasted'));
    }
}
  
new Faucet();
