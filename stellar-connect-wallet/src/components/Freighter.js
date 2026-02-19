import {signTransaction, setAllowed, getAddress} from '@stellar/freighter-api';
import * as StellarSdk from '@stellar/stellar-sdk';

const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;

const checkConnection = async () => {
    return await setAllowed();
};

const retrievePublicKey = async () => {
    const { address } = await getAddress();
    return address;
};

const getBalance = async () => {
    await setAllowed();
    const { address } = await getAddress();
    const account = await server.loadAccount(address);

    const xlm = account.balances.find((b) => b.asset_type === 'native');
    return xlm ? xlm.balance : '0';
};

const userSignTransaction = async (xdr, network, signWith) => {
    return await signTransaction(xdr, {
        network,
        accountToSign: signWith,
    });
};

const sendPayment = async (destination, amount) => {
    // Validate destination address
    if (!StellarSdk.StrKey.isValidEd25519PublicKey(destination)) {
        throw new Error('Invalid Stellar address');
    }

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
        throw new Error('Amount must be greater than 0');
    }

    const senderPublicKey = await retrievePublicKey();
    const account = await server.loadAccount(senderPublicKey);

    // Build the transaction
    const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
    })
        .addOperation(
            StellarSdk.Operation.payment({
                destination: destination,
                asset: StellarSdk.Asset.native(),
                amount: String(amount),
            })
        )
        .setTimeout(30)
        .build();

    // Convert to XDR and sign via Freighter
    const xdr = transaction.toXDR();
    const signedResponse = await signTransaction(xdr, {
        networkPassphrase: NETWORK_PASSPHRASE,
    });

    const signedXdr = signedResponse.signedTxXdr;
    const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(
        signedXdr,
        NETWORK_PASSPHRASE
    );

    // Submit the transaction
    const result = await server.submitTransaction(signedTransaction);
    return result;
};

export {checkConnection, retrievePublicKey, getBalance, userSignTransaction, sendPayment};
