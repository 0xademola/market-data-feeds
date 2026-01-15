import { PrivateKeyAccount, privateKeyToAccount } from 'viem/accounts';
import { keccak256, encodePacked } from 'viem';

export class OracleSigner {
    private account: PrivateKeyAccount;

    constructor(privateKey: `0x${string}`) {
        this.account = privateKeyToAccount(privateKey);
    }

    get address() {
        return this.account.address;
    }

    /**
     * Signs a data payload for on-chain verification.
     * @param dataEncoded The ABI encoded data (from normalizers.encodeX)
     * @param timestamp Timestamp to include in signature to prevent replay if not in data
     */
    async signData(dataEncoded: `0x${string}`): Promise<`0x${string}`> {
        // We assume dataEncoded already contains the timestamp and critical fields.
        // We sign the hash of the bytes.
        const hash = keccak256(dataEncoded);
        return this.account.signMessage({ message: { raw: hash } });
    }
}
