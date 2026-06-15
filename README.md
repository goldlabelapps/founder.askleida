## Leida Dashboard

- Practitioners
- Products
    - Awin afilliate / Lookfantastic 

## Awin Lookfantastic Data

### awin_lookfantastic

- 25,707 product rows from a single Lookfantastic snapshot are currently stored here.
- Every row is for LOOKFANTASTIC UK and uses GBP pricing.

The table is structured as flattened product fields plus a raw JSON payload.
Core populated fields include:

- aw_product_id
- merchant_product_id
- product_name
- search_price
- aw_deep_link
- merchant_deep_link
- merchant_name
- category_name

The raw data payload typically contains keys like:

- product_name
- description
- category_name
- category_id
- aw_image_url
- merchant_image_url
- display_price
- store_price
- delivery_cost
- language
- data_feed_id

Largest categories right now:

- Cosmetics (11,723)
- Skincare (7,203)
- Haircare (3,757)
- Fragrance (2,677)

Price range:

- minimum: 1.40
- maximum: 2160
- average: ~42.70

Identifier fields currently empty across the table include:

- ean
- upc
- isbn
- mpn
- product_gtin
- stock_quantity
- source_last_updated
    
![NextJS](public/shared/png/python.png)  
> Wei Zang's son

_[powered by °NX](https://goldlabel.pro/nx/nx-admin)_ 
