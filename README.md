# Echo Faucet

## Running

### Create config

Create `.echofaucetrc` on the root of project:

```json
{
    "echo_url": "wss://testnet.echo-dev.io",
    "account": {
        "id": "1.2.1234",
        "privateKey": "5J9jhJ...BtxF81o"
    },
    "amount": {
        "asset_id": "1.3.0",
        "amount": 5000000000
    }
}

```

Run application

```bash
npm install
npm run start
```
