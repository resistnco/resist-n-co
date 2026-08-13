#!/usr/bin/env python3
"""
Sync all Printify products: upload designs, create products, get variant IDs.
"""
import base64, json, os, requests, time

TOKEN = os.popen('grep PRINTIFY_API_TOKEN .env | cut -d\'"\' -f2').read().strip()
SHOP_ID = "28569727"
DESIGN_DIR = "pod_sync/designs"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

# Printify products to sync
# (db_id, slug, blueprint_id, price_cents, colors, sizes, design_slug)
PRINTIFY_PRODUCTS = [
    # Product 2 already done, skip it
    (5, "hoodie-no-pasaran", 172, 5499, ["Black", "Navy", "Maroon", "Dark Heather", "Sport Grey"], ["S", "M", "L", "XL", "2XL", "3XL"], "hoodie-nopasaran"),
    (10, "tshirt-tiny-hands", 6, 2799, ["Black", "White", "Navy", "Dark Heather", "Sport Grey"], ["S", "M", "L", "XL", "2XL", "3XL"], "tshirt-tiny-hands"),
    (12, "tshirt-fact-check", 302, 3199, ["Black", "Navy", "Dark Grey Heather", "Maroon", "Athletic Heather"], ["S", "M", "L", "XL", "2XL", "3XL"], "tshirt-fact-check"),
    (13, "tshirt-no-planet-b", 471, 2999, ["Black", "Navy", "Dark Grey Heather", "Maroon", "Red"], ["S", "M", "L", "XL", "2XL", "3XL"], "tshirt-no-planet-b"),
    (14, "hoodie-no-kings", 77, 5499, ["Black", "Navy", "Maroon", "Dark Heather", "Sport Grey"], ["S", "M", "L", "XL", "2XL", "3XL"], "hoodie-no-kings"),
    (16, "hoodie-not-my-circus", 77, 5499, ["Black", "Navy", "Maroon", "Dark Heather", "Sport Grey"], ["S", "M", "L", "XL", "2XL", "3XL"], "hoodie-not-my-circus"),
    (18, "hoodie-memes-evidence", 129, 5799, ["Black", "Navy", "Maroon", "Dark Heather", "Sport Grey"], ["S", "M", "L", "XL", "2XL", "3XL"], "hoodie-memes"),
    (20, "tuque-question-everything", 425, 2299, ["Black", "Navy", "Dark Grey", "Maroon"], ["Unique"], "tuque-question"),
]

# For coasters, search catalog for cork-backed coaster
COASTER_PRODUCTS = [
    (8, "coaster-organize", 1499, ["Natural Cork", "Black"], ["Set de 4"], "coaster-organize"),
    (23, "coaster-organize-mobilize", 1499, ["Natural Cork", "Black"], ["Set de 4"], "coaster-organize-mobilize"),
]

def upload_design(design_path):
    """Upload a design file to Printify."""
    with open(design_path, "rb") as f:
        file_b64 = base64.b64encode(f.read()).decode()
    resp = requests.post(
        "https://api.printify.com/v1/uploads/images.json",
        headers=HEADERS,
        json={"file_name": os.path.basename(design_path), "contents": file_b64}
    )
    data = resp.json()
    if data.get("id"):
        return data["id"]
    print(f"  Upload error: {json.dumps(data)[:200]}")
    return None

def get_first_provider_with_variants(blueprint_id):
    """Get the first print provider that has variants for a blueprint."""
    pp_resp = requests.get(
        f"https://api.printify.com/v1/catalog/blueprints/{blueprint_id}/print_providers.json",
        headers=HEADERS
    )
    providers = pp_resp.json()
    if isinstance(providers, dict):
        providers = providers.get("data", [])
    if not providers:
        return None, []
    
    for provider in providers[:10]:  # Try first 10 providers
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

def filter_variants(variants, colors, sizes):
    """Filter variants by our colors and sizes."""
    matching = []
    for v in variants:
        opts = v.get("options", {})
        color = opts.get("color", "")
        size = opts.get("size", "")
        # Handle "Unique" size for accessories
        if sizes == ["Unique"]:
            if color in colors:
                matching.append(v)
        else:
            if color in colors and size in sizes:
                matching.append(v)
    return matching

def create_product(db_id, slug, blueprint_id, price_cents, colors, sizes, design_slug):
    """Create a product on Printify with design uploaded."""
    design_path = f"{DESIGN_DIR}/{design_slug}.png"
    if not os.path.exists(design_path):
        print(f"  Design not found: {design_path}")
        return None
    
    # Get provider and variants
    provider_id, all_variants = get_first_provider_with_variants(blueprint_id)
    if not provider_id:
        print(f"  No provider with variants for blueprint {blueprint_id}")
        return None
    
    matching = filter_variants(all_variants, colors, sizes)
    if not matching:
        print(f"  No matching variants found")
        return None
    
    print(f"  Provider: {provider_id}, Matching variants: {len(matching)}")
    
    # Upload design
    file_id = upload_design(design_path)
    if not file_id:
        return None
    print(f"  Design uploaded: {file_id}")
    
    # Create product
    variant_ids = [v["id"] for v in matching]
    payload = {
        "title": f"Resist N Co - {slug.replace('-', ' ').title()}",
        "description": f"Produit Resist N Co - {slug}. Imprimé à la demande, qualité premium.",
        "blueprint_id": blueprint_id,
        "print_provider_id": provider_id,
        "tags": ["resistance", "activism", "political", "resist-n-co"],
        "variants": [{"id": vid, "price": price_cents, "is_enabled": True} for vid in variant_ids],
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
            "db_product_id": db_id,
            "printify_product_id": data["id"],
            "blueprint_id": blueprint_id,
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

def find_coaster_blueprint():
    """Search for cork-backed coaster in Printify catalog."""
    bp_resp = requests.get("https://api.printify.com/v1/catalog/blueprints.json", headers=HEADERS)
    bps = bp_resp.json()
    if isinstance(bps, dict):
        bps = bps.get("data", [])
    for bp in bps:
        title = bp.get("title", "").lower()
        if "coaster" in title:
            print(f"  Found: {bp['id']} - {bp.get('title')}")
            return bp["id"]
    return None

# Main execution
results = []

# Regular products
print("=== Syncing Printify products ===")
for db_id, slug, bp_id, price, colors, sizes, design_slug in PRINTIFY_PRODUCTS:
    print(f"\nProduct {db_id}: {slug}")
    result = create_product(db_id, slug, bp_id, price, colors, sizes, design_slug)
    if result:
        results.append(result)
    time.sleep(1)  # Rate limit

# Coaster products
print("\n=== Finding coaster blueprint ===")
coaster_bp = find_coaster_blueprint()
if coaster_bp:
    for db_id, slug, price, colors, sizes, design_slug in COASTER_PRODUCTS:
        print(f"\nProduct {db_id}: {slug}")
        result = create_product(db_id, slug, coaster_bp, price, colors, sizes, design_slug)
        if result:
            results.append(result)
        time.sleep(1)
else:
    print("  No coaster blueprint found, skipping coaster products")

# Save all mappings
with open("pod_sync/printify_all_mappings.json", "w") as f:
    json.dump(results, f, indent=2)
print(f"\n=== Done: {len(results)} products created ===")
