#!/usr/bin/env python3
"""
Sync remaining Printify products with correct blueprint IDs.
"""
import base64, json, os, requests, time

TOKEN = os.popen('grep PRINTIFY_API_TOKEN .env | cut -d\'"\' -f2').read().strip()
SHOP_ID = "28569727"
DESIGN_DIR = "pod_sync/designs"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

# Corrected products with valid blueprint IDs
# (db_id, slug, blueprint_id, price_cents, color_map, size_list, design_slug)
# color_map: {our_color: printify_color}
REMAINING_PRODUCTS = [
    # Product 5: hoodie-no-pasaran → bp 77 (Gildan Heavy Blend Hoodie)
    {
        "db_id": 5, "slug": "hoodie-no-pasaran", "bp": 77, "price": 5499,
        "design": "hoodie-nopasaran",
        "colors": ["Black", "Navy", "Maroon", "Dark Heather", "Sport Grey"],
        "sizes": ["S", "M", "L", "XL", "2XL", "3XL"]
    },
    # Product 12: tshirt-fact-check → bp 184 (Bella+Canvas Triblend)
    {
        "db_id": 12, "slug": "tshirt-fact-check", "bp": 184, "price": 3199,
        "design": "tshirt-fact-check",
        "colors": ["Solid Black TriBlend", "Navy TriBlend", "Grey TriBlend", "Athletic Grey TriBlend", "Black Heather"],
        "sizes": ["S", "M", "L", "XL", "2XL", "XS"]
    },
    # Product 13: tshirt-no-planet-b → bp 6 (Gildan 64000)
    {
        "db_id": 13, "slug": "tshirt-no-planet-b", "bp": 6, "price": 2999,
        "design": "tshirt-no-planet-b",
        "colors": ["Black", "White", "Navy", "Dark Heather", "Sport Grey"],
        "sizes": ["S", "M", "L", "XL", "2XL", "3XL"]
    },
    # Product 18: hoodie-memes-evidence → bp 175 (Bella+Canvas Sponge Fleece)
    {
        "db_id": 18, "slug": "hoodie-memes-evidence", "bp": 175, "price": 5799,
        "design": "hoodie-memes",
        "colors": ["Black", "Navy", "Maroon", "Athletic Heather", "Forest"],
        "sizes": ["S", "M", "L", "XL", "2XL", "XS"]
    },
    # Product 20: tuque-question-everything → bp 1691 (Cuffed Beanie)
    {
        "db_id": 20, "slug": "tuque-question-everything", "bp": 1691, "price": 2299,
        "design": "tuque-question",
        "colors": ["Black", "Navy", "Dark Grey", "Red"],
        "sizes": ["One size"]
    },
    # Product 8: coaster-organize → bp 480 (Cork Back Coaster)
    {
        "db_id": 8, "slug": "coaster-organize", "bp": 480, "price": 1499,
        "design": "coaster-organize",
        "colors": None,  # Coaster uses shape/material
        "sizes": None,
        "use_all_variants": True
    },
    # Product 23: coaster-organize-mobilize → bp 480
    {
        "db_id": 23, "slug": "coaster-organize-mobilize", "bp": 480, "price": 1499,
        "design": "coaster-organize-mobilize",
        "colors": None,
        "sizes": None,
        "use_all_variants": True
    },
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

def create_product(product):
    bp = product["bp"]
    design_path = f"{DESIGN_DIR}/{product['design']}.png"
    
    if not os.path.exists(design_path):
        print(f"  Design not found: {design_path}")
        return None
    
    provider_id, all_variants = get_provider_and_variants(bp)
    if not provider_id:
        print(f"  No provider with variants for bp {bp}")
        return None
    
    if product.get("use_all_variants"):
        matching = all_variants
    else:
        matching = []
        for v in all_variants:
            opts = v.get("options", {})
            color = opts.get("color", "")
            size = opts.get("size", "")
            if color in product["colors"] and size in product["sizes"]:
                matching.append(v)
    
    if not matching:
        # Show available colors/sizes
        avail_colors = set()
        avail_sizes = set()
        for v in all_variants:
            opts = v.get("options", {})
            avail_colors.add(opts.get("color", ""))
            avail_sizes.add(opts.get("size", ""))
        print(f"  No matching variants. Available colors: {sorted(avail_colors)[:10]}, sizes: {sorted(avail_sizes)}")
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
print("=== Syncing remaining Printify products ===")
for product in REMAINING_PRODUCTS:
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

print(f"\n=== Done: {len(results)} new products created, {len(all_results)} total ===")
