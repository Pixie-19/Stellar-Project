import React, { useState } from 'react';
import { checkConnection, retrievePublicKey, getBalance } from './Freighter';

const Header = () => {
    const [connected, setConnected] = useState(false);
    const [publicKey, setPublicKey] = useState('');
    const [balance, setBalance] = useState('0');

    const connectWallet = async () => {
        try {
            const allowed = await checkConnection();
            if(!allowed) return alert('Permission denied');

            const key = await retrievePublicKey();
            const bal = await getBalance();

            setPublicKey(key);
            setBalance(Number(bal).toFixed(2));
            setConnected(true); 
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', backgroundColor: '#1a1a2e', color: 'white' }}>
            <div><b>Stellar dApp</b></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {publicKey && (
                    <>
                        <span>{`${publicKey.slice(0,4)}...${publicKey.slice(-4)}`}</span>
                        <span style={{ color: '#4ade80' }}>{balance} XLM</span>
                    </>
                )}

                <button
                    onClick={connectWallet}
                    disabled={connected}
                    style={{ padding: '8px 16px', borderRadius: '5px', border: 'none', color: 'white', cursor: connected ? 'default' : 'pointer', backgroundColor: connected ? '#22c55e' : '#3b82f6' }}
                >
                    {connected ? 'Connected' : 'Connect Wallet'}
                </button>
            </div>
        </div>
    );
};

export default Header;