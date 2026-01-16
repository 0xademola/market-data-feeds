import { keccak256, encodePacked } from 'viem';
import { deepSort } from '../utils/JsonUtils';

export interface MerkleTree {
    root: `0x${string}`;
    leaves: `0x${string}`[];
    layers: `0x${string}`[][];
}

export class MerkleService {

    /**
     * Hashes a data object to a leaf node.
     * IMPROVEMENT: Uses deep sorting for determinism.
     * SECURITY: Double-hashes the leaf to prevent second-image attacks 
     * where a leaf data could be constructed to look like a parent node (64 bytes).
     * Leaf = Keccak(Keccak(Data))
     */
    getLeaf(data: any): `0x${string}` {
        const sorted = deepSort(data);
        const payload = JSON.stringify(sorted);
        // First hash of the data
        const dataHash = keccak256(encodePacked(['string'], [payload]));
        // Double hash to distinguish from internal nodes (which are Hash(L+R))
        return keccak256(encodePacked(['bytes32'], [dataHash]));
    }

    /**
     * Constructs a Merkle Tree from a list of data objects.
     * Returns the root and the full tree layers.
     */
    createTree(dataset: any[]): MerkleTree {
        if (dataset.length === 0) throw new Error("Cannot create tree from empty dataset");

        const leaves = dataset.map(d => this.getLeaf(d)).sort(); // Sort for consistent tree
        const layers: `0x${string}`[][] = [leaves];

        let currentLayer = leaves;
        while (currentLayer.length > 1) {
            const nextLayer: `0x${string}`[] = [];
            for (let i = 0; i < currentLayer.length; i += 2) {
                const left = currentLayer[i];
                const right = (i + 1 < currentLayer.length) ? currentLayer[i + 1] : left; // Duplicate last if odd

                // Sorted Hashing: Hash(Min(A,B), Max(A,B))
                // This is critical for verification without position info
                const [min, max] = BigInt(left) < BigInt(right) ? [left, right] : [right, left];
                nextLayer.push(keccak256(encodePacked(['bytes32', 'bytes32'], [min, max])));
            }
            layers.push(nextLayer);
            currentLayer = nextLayer;
        }

        const root = layers[layers.length - 1][0];
        return { root, leaves, layers };
    }

    /**
     * Generates a Merkle Proof for a specific data item.
     */
    getProof(data: any, treeConfig: MerkleTree): `0x${string}`[] {
        const targetLeaf = this.getLeaf(data);
        let index = treeConfig.leaves.indexOf(targetLeaf);

        if (index === -1) throw new Error("Item not found in tree");

        const proof: `0x${string}`[] = [];
        let currentLayerIndex = 0;

        // Traverse up
        while (currentLayerIndex < treeConfig.layers.length - 1) {
            const currentLayer = treeConfig.layers[currentLayerIndex];
            const isLeft = index % 2 === 0;

            // Getting sibling index
            const siblingIndex = isLeft ? index + 1 : index - 1;

            if (siblingIndex < currentLayer.length) {
                proof.push(currentLayer[siblingIndex]);
            } else {
                // If odd number of nodes, the last node is its own sibling (duplicated in hashing)
                // So valid proof needs the node itself as sibling
                proof.push(currentLayer[index]);
            }

            index = Math.floor(index / 2);
            currentLayerIndex++;
        }

        return proof;
    }

    /**
     * Verifies a Merkle Proof.
     */
    verify(data: any, proof: `0x${string}`[], root: `0x${string}`): boolean {
        let computedHash = this.getLeaf(data);

        for (const sibling of proof) {
            const [min, max] = BigInt(computedHash) < BigInt(sibling)
                ? [computedHash, sibling]
                : [sibling, computedHash];

            computedHash = keccak256(encodePacked(['bytes32', 'bytes32'], [min, max]));
        }

        return computedHash === root;
    }
}
