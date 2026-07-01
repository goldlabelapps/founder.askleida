export const setupClaude = (q: string) => `

You are Leida, an AI skin care therapist with 20 years of professional experience.
You are up to date with modern, evidence-based skin care techniques, ingredients, routines, and treatment best practices.

Context:
You have access to the product title and description for a single product, which is provided after this prompt. The product title and description are separated from this prompt by a line break, and are prefixed with "Product Title and Description:". The product title and description may contain information about the product's ingredients, benefits, usage instructions, skin type suitability, and other relevant details.
create a summary of the product in 2-3 sentences, highlighting the key benefits and features of the product. The summary should be concise, informative, and engaging, providing a clear overview of what the product is and why it is beneficial for skin care.
create a list of tags for the product based on the product title and description. The tags should be relevant keywords or phrases that capture the main attributes, ingredients, benefits, or skin type suitability of the product. The tags should be concise and descriptive, helping users quickly understand the key aspects of the product.

Product Title and Description:
${q}
`;


export const testProduct = {
    "ean": "642498022845",
    "body": "Start your day with this Aromatherapy Associates bundle, curated to refresh your skin and senses.   Made for your morning routine, this duo is formulated to cleanse and hydrate your base, while releasing an array of awakening, uplifting aromas.  Set Contents:  Revive Morning Body Wash 250ml Lather in the refreshing feel of Aromatherapy Associates’ Revive Morning Body Wash. Formulated to revitalise without stripping moisture, it includes squalane, AHAs, and jojoba beads to encourage radiant-looking skin. Uplifting citrus and woody notes of grapefruit, rosemary, and juniper berry work to awaken the senses with each wash.  Revive Morning Body Lotion 250ml Replenish your base with the Revive Morning Body Lotion, a fast-absorbing cream that works to leave skin soft, smooth, and subtly scented. Alongside supporting the skin barrier with a nourishing blend of hyaluronic acid, vitamin C, and vitamin E, it’s fragranced with the uplifting notes of grapefruit, rosemary, and juniper berry.",
    "slug": "aromatherapy-associates-revive-am-ritual",
    "image": "https://s4.thcdn.com/productimg/1600/1600/17796708-2145327221008018.jpg",
    "price": 38,
    "title": "Aromatherapy Associates Revive AM Ritual",
    "status": "draft",
    "id_awin": "44620932625",
    "merchant": "LOOKFANTASTIC UK",
    "url_awin": "https://www.awin1.com/pclick.php?p=44620932625&a=2817868&m=2082",
    "thumbnail": "https://images2.productserve.com/?w=200&h=200&bg=white&trim=5&t=letterbox&url=ssl%3As4.thcdn.com%2Fproductimg%2F1600%2F1600%2F17796708-2145327221008018.jpg&feedId=2082&k=ae9a56d089321cbfd3a7aacc0a0f98cd42579167",
    "description": "Start your day with this Aromatherapy Associates bundle, curated to refresh your skin and senses.   Made for your morning routine, this duo is formulated to cleanse and hydrate your base, while releasing an array of awakening, uplifting aromas.  Set Conte",
    "id_merchant": "17796708",
    "search_price": 38,
    "url_merchant": "https://www.lookfantastic.com/p/aromatherapy-associates-revive-am-ritual/17796708/?switchcurrency=GBP&shippingcountry=GB",
    "specifications": "Cleanse with the Revive Morning Body Wash, then follow with the uplifting and hydrating Revive Morning Body Lotion."
};

