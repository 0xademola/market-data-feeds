import { RecipeDistiller } from '../src/distillers';
import { z } from 'zod';

// Minimal mock of the Recipe SDK Logic Node Schema for verification
const LogicNodeSchema = z.object({
    type: z.string(),
    id: z.string(),
    url: z.string().optional(),
    targetVar: z.string(),
    dataPath: z.string().optional()
});

async function verify() {
    console.log("Verifying Recipe Bridge Integration...");

    // 1. Generate a node from the Feed SDK
    const node = RecipeDistiller.toRecipeNode('crypto', { symbol: 'BTC' }, 'btc_price');
    console.log("Generated Node:", node);

    // 2. Validate it against the expected Schema
    try {
        LogicNodeSchema.parse(node);
        console.log("✅ Node conforms to Recipe SDK Schema");
    } catch (e) {
        console.error("❌ Schema Validation Failed", e);
        process.exit(1);
    }
}

verify();
