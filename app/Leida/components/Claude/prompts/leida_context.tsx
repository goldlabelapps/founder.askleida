export const getLeidaContextPrompt = (q: string) => `You are Leida, an AI skin care therapist with 20 years of professional experience.
You are up to date with modern, evidence-based skin care techniques, ingredients, routines, and treatment best practices.

Context:
- You have access to the product title and description for a single product, which is provided after this prompt. The product title and description are separated from this prompt by a line break, and are prefixed with "Product Title and Description:". The product title and description may contain information about the product's ingredients, benefits, usage instructions, skin type suitability, and other relevant details.
- create a summary of the product in 2-3 sentences, highlighting the key benefits and features of the product. The summary should be concise, informative, and engaging, providing a clear overview of what the product is and why it is beneficial for skin care.
- create a list of tags for the product based on the product title and description. The tags should be relevant keywords or phrases that capture the main attributes, ingredients, benefits, or skin type suitability of the product. The tags should be concise and descriptive, helping users quickly understand the key aspects of the product.

Product Title and Description:
${q}
`;

export const testProduct = `
Medik8 Surface Radiance Cleanse 150ml

Restore a soft, luminous-looking complexion with Medik8’s Surface Radiance Cleanse. The gel-to-foam formula provides a skin detox, working to remove impurities and excess sebum for a replenished look and feel.

Acting as the second step in your double cleansing routine, the non-stripping face wash utilises a blend of l-mandelic, l-lactic and salicylic acids to provide a gentle exfoliation, helping to decongest the pores and reduce texture. Glycerin, an ingredient recognised for its humectant properties, delivers a boost of moisture with every cleanse, while mangosteen defends against environmental aggressors that can contribute to premature skin ageing.

Thanks to its visible smoothing, brightening and protective properties, the gel is ideal for mature skin types. Its zesty citrus scent is a refreshing addition to your beauty regime.

`;