#!/usr/bin/env python3
"""
Create remaining products (originally Printful/Gelato/Gooten) on Printify
since the Printful V1 API requires publicly accessible URLs for file uploads.
"""
import base64, json, os, requests, time

TOKEN = os.popen('grep PRINTIFY_API_TOKEN .env | cut -d\'"\' -f2').read().strip()
SHOP_ID = "28569727"
DESIGN_DIR = "pod_sync/designs"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

# Products originally assigned to Printful, Gelato, Gooten
# (db_id, slug, blueprint_id, price_cents, colors, sizes, design_slug)
PRINTFUL_PRODUCTS = [
    # Product 1: tshirt-resist → bp 12 (Bella+Canvas 3001)
    {"db_id": 1, "slug": "tshirt-resist", "bp": 12, "price": 2999, "design": "tshirt-resist",
     "colors": ["Black", "Navy", "Dark Grey Heather", "Heather Forest", "Maroon"],
     "sizes": ["XS", "S", "M", "L", "XL", "2XL", "3XL"]},
    # Product 4: hoodie-climate-justice → bp 77 (Gildan Heavy Blend Hoodie)
    {"db_id": 4, "slug": "hoodie-climate-justice", "bp": 77, "price": 5499, "design": "hoodie-climate",
     "colors": ["Black", "Navy", "Dark Heather", "Heather Forest", "Sport Grey"],
     "sizes": ["S", "M", "L", "XL", "2XL", "3XL"]},
    # Product 6: tuque-power-people → bp 1691 (Cuffed Beanie)
    {"db_id": 6, "slug": "tuque-power-people", "bp": 1691, "price": 2499, "design": "tuque-power",
     "colors": ["Black", "Navy", "Dark Grey", "Red"],
     "sizes": ["One size"]},
    # Product 9: tshirt-bye-don → bp 12 (Bella+Canvas 3001)
    {"db_id": 9, "slug": "tshirt-bye-don", "bp": 12, "price": 2999, "design": "tshirt-bye-don",
     "colors": ["Black", "Navy", "Dark Grey Heather", "Maroon", "Red"],
     "sizes": ["XS", "S", "M", "L", "XL", "2XL", "3XL"]},
    # Product 11: tshirt-covfefe → bp 6 (Gildan 64000)
    {"db_id": 11, "slug": "tshirt-covfefe", "bp": 6, "price": 3299, "design": "tshirt-covfefe",
     "colors": ["Black", "Pepper", "Navy", "Forest", "Burgundy"],
     "sizes": ["S", "M", "L", "XL", "2XL", "3XL"]},
    # Product 15: hoodie-grift-alert → bp 175 (Bella+Canvas Sponge Fleece)
    {"db_id": 15, "slug": "hoodie-grift-alert", "bp": 175, "price": 5999, "design": "hoodie-grift-alert",
     "colors": ["Black", "Navy", "Maroon", "Athletic Heather", "Forest"],
     "sizes": ["S", "M", "L", "XL", "2XL", "XS"]},
    # Product 17: hoodie-keep-oil-ground → bp 175
    {"db_id": 17, "slug": "hoodie-keep-oil-ground", "bp": 175, "price": 5999, "design": "hoodie-keep-oil",
     "colors": ["Black", "Navy", "Maroon", "Athletic Heather", "Forest"],
     "sizes": ["S", "M", "L", "XL", "2XL", "XS"]},
    # Product 19: tuque-truth-matters → bp 1691
    {"db_id": 19, "slug": "tuque-truth-matters", "bp": 1691, "price": 2499, "design": "tuque-truth",
     "colors": ["Black", "Navy", "Dark Grey", "Red", "Maroon"],
     "sizes": ["One size"]},
    # Product 22: mug-resist-every-day → bp 425 (Mug 15oz)
    {"db_id": 22, "slug": "mug-resist-every-day", "bp": 425, "price": 1699, "design": "mug-resist-every-day",
     "colors": ["Black", "White"],
     "sizes": ["15oz"]},
    # Product 24: tote-no-planet-b → search for tote bag blueprint
    {"db_id": 24, "slug": "tote-no-planet-b", "bp": None, "price": 1999, "design": "tote-no-planet-b",
     "colors": ["Black", "White"],
     "sizes": ["One size"]},
    # Gelato products
    # Product 3: tshirt-solidarity → bp 12
    {"db_id": 3, "slug": "tshirt-solidarity", "bp": 12, "price": 2999, "design": "tshirt-solidarity",
     "colors": ["Black", "Dark Grey Heather", "Heather Forest", "Maroon", "Navy"],
     "sizes": ["XS", "S", "M", "L", "XL", "2XL", "3XL"]},
    # Product 7: mug-defend-earth → bp 425
    {"db_id": 7, "slug": "mug-defend-earth", "bp": 425, "price": 1699, "design": "mug-defend",
     "colors": ["Black", "White"],
     "sizes": ["15oz"]},
    # Gooten product
    # Product 21: tuque-resist-every-day → bp 1691
    {"db_id": 21, "slug": "tuque-resist-every-day", "bp": 1691, "price": 2499, "design": "tuque-resist-every-day",
     "colors": ["Black", "Navy", "Dark Grey", "Red", "Maroon"],
     "sizes": ["One size"]},
]

def upload_design(design_path):
    with open(design_path, "rb") as f:
        file_b64 = base64.b64encode(f.read()).decode()
    resp = requests.post(
        "https://api.printify.com/v1/uploads/images.json",
        headers=HEADERS,
        json={"file_name": os.path.basename(design_path), "contents": file_b64}
    )
    data = resp.json()
    return data.get("id")

def get_provider_and_variants(blueprint_id):
    pp_resp = requests.get(
        f"https://api.printify.com/v1/catalog/blueprints/{blueprint_id}/print_providers.json",
        headers=HEADERS
    )
    providers = pp_resp.json()
    if isinstance(providers, dict):
        providers = providers.get("data", [])
    
    for provider in providers[:10]:
        pid = provider["id"]
        var_resp = requests.get(
            f"https://api.printify.com/v1/catalog/blueprints/{blueprint_id}/print_providers/{pid}/variants.json",
            headers=HEADERS
        )
        var_data = var_resp.json()
        variants = var_data.get("variants", [])
        if variants:
            return pid, variants
    return None, []

def find_tote_blueprint():
    bp_resp = requests.get("https://api.printify.com/v1/catalog/blueprints.json", headers=HEADERS)
    bps = bp_resp.json()
    if isinstance(bps, dict):
        bps = bps.get("data", [])
    for bp in bps:
        title = bp.get("title", "").lower()
        if "tote" in title and "bag" in title:
            return bp["id"]
    return None

def create_product(product):
    bp = product["bp"]
    if bp is None and "tote" in product["slug"]:
        bp = find_tote_blueprint()
        if not bp:
            print(f"  No tote blueprint found")
            return None
        product["bp"] = bp
    
    design_path = f"{DESIGN_DIR}/{product['design']}.png"
    if not os.path.exists(design_path):
        print(f"  Design not found: {design_path}")
        return None
    
    provider_id, all_variants = get_provider_and_variants(bp)
    if not provider_id:
        print(f"  No provider with variants for bp {bp}")
        return None
    
    matching = []
    for v in all_variants:
        opts = v.get("options", {})
        color = opts.get("color", "")
        size = opts.get("size", "")
        if "One size" in product["sizes"]:
            if color in product["colors"]:
                matching.append(v)
        elif "15oz" in product["sizes"]:
            if color in product["colors"] and "15oz" in size:
                matching.append(v)
        else:
            if color in product["colors"] and size in product["sizes"]:
                matching.append(v)
    
    if not matching:
        avail_colors = set()
        avail_sizes = set()
        for v in all_variants:
            opts = v.get("options", {})
            avail_colors.add(opts.get("color", ""))
            avail_sizes.add(opts.get("size", ""))
        print(f"  No matching variants. Colors: {sorted(avail_colors)[:8]}, Sizes: {sorted(avail_sizes)}")
        return None
    
    print(f"  Provider: {provider_id}, Variants: {len(matching)}")
    
    file_id = upload_design(design_path)
    if not file_id:
        print(f"  Upload failed")
        return None
    print(f"  Design uploaded: {file_id}")
    
    variant_ids = [v["id"] for v in matching]
    payload = {
        "title": f"Resist N Co - {product['slug'].replace('-', ' ').title()}",
        "description": f"Produit Resist N Co - {product['slug']}. Imprimé à la demande, qualité premium.",
        "blueprint_id": bp,
        "print_provider_id": provider_id,
        "tags": ["resistance", "activism", "political", "resist-n-co"],
        "variants": [{"id": vid, "price": product["price"], "is_enabled": True} for vid in variant_ids],
        "print_areas": [{
            "variant_ids": variant_ids,
            "placeholders": [{
                "position": "front",
                "images": [{"id": file_id, "x": 0.5, "y": 0.5, "scale": 1, "angle": 0}]
            }]
        }]
    }
    
    resp = requests.post(
        f"https://api.printify.com/v1/shops/{SHOP_ID}/products.json",
        headers=HEADERS,
        json=payload
    )
    data = resp.json()
    
    if data.get("id"):
        print(f"  Product created: {data['id']}")
        return {
            "db_product_id": product["db_id"],
            "printify_product_id": data["id"],
            "blueprint_id": bp,
            "provider_id": provider_id,
            "file_id": file_id,
            "original_supplier": "Printful/Gelato/Gooten",
            "variants": [
                {"variant_id": v["id"], "color": v.get("options", {}).get("color"), "size": v.get("options", {}).get("size")}
                for v in matching
            ]
        }
    else:
        print(f"  Error: {json.dumps(data)[:300]}")
        return None

# Main
results = []
print("=== Creating remaining products on Printify ===")
for product in PRINTFUL_PRODUCTS:
    print(f"\nProduct {product['db_id']}: {product['slug']}")
    result = create_product(product)
    if result:
        results.append(result)
    time.sleep(1)

# Merge with previous results
prev = []
if os.path.exists("pod_sync/printify_all_mappings.json"):
    with open("pod_sync/printify_all_mappings.json") as f:
        prev = json.load(f)

all_results = prev + results
with open("pod_sync/printify_all_mappings.json", "w") as f:
    json.dump(all_results, f, indent=2)

print(f"\n=== Done: {len(results)} new products, {len(all_results)} total ===")
