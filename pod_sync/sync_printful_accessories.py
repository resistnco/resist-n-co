#!/usr/bin/env python3
"""Sync remaining products to Printful (tuques, mugs, totes) with size/color mapping fixes."""
import json, os, requests, sqlite3, time

GITHUB_RAW = "https://raw.githubusercontent.com/resistnco/resist-n-co/master/pod_sync/designs"
PRINTFUL_KEY = os.environ.get("PRINTFUL_API_KEY", "")
DB_PATH = "dev.db"
HEADERS = {"Authorization": f"Bearer {PRINTFUL_KEY}", "Content-Type": "application/json"}

DESIGN_MAP = {
    "tuque-power-people": "tuque-power.png",
    "tuque-truth-matters": "tuque-truth.png",
    "tuque-question-everything": "tuque-question.png",
    "tuque-resist-every-day": "tuque-resist-every-day.png",
    "mug-defend-earth": "mug-defend.png",
    "mug-resist-every-day": "mug-resist-every-day.png",
    "tote-no-planet-b": "tote-no-planet-b.png",
}

# Printful catalog IDs
CATALOG = {
    "tuque": 458,  # All-Over Print Beanie (S/M/L)
    "mug": 19,     # 11oz Mug
    "tote": 274,   # All-Over Print Large Tote
}

# Size mappings: our DB size -> Printful size
SIZE_MAP = {
    "Unique": "M",      # One-size -> Medium (beanie)
    "11oz": "11 oz",   # Mug
    "Set de 4": None,  # Coaster - skip
}

# Color override: for products with limited color options (beanie=White only, mug=White only)
# We'll map all colors to the available one
COLOR_OVERRIDE = {
    "tuque": "White",   # Beanie only comes in White
    "mug": "White",     # Mug only comes in White
    "tote": "Black",    # Tote: use Black for our Black
}

def get_product_type(slug):
    if slug.startswith("tuque"): return "tuque"
    if slug.startswith("mug") or slug.startswith("tasse"): return "mug"
    if slug.startswith("tote") or slug.startswith("sac"): return "tote"
    return None

def get_products():
    conn = sqlite3.connect(DB_PATH); conn.row_factory = sqlite3.Row
    rows = conn.execute("SELECT id, name, slug, category, basePrice FROM products ORDER BY id").fetchall()
    conn.close(); return [dict(r) for r in rows]

def get_variants(pid):
    conn = sqlite3.connect(DB_PATH); conn.row_factory = sqlite3.Row
    rows = conn.execute("SELECT id, color, size, colorHex, price FROM product_variants WHERE productId = ? ORDER BY id", (pid,)).fetchall()
    conn.close(); return [dict(r) for r in rows]

def get_catalog_variants(catalog_id):
    resp = requests.get(f"https://api.printful.com/products/{catalog_id}", headers=HEADERS)
    if resp.status_code == 200:
        return resp.json().get("result", {}).get("variants", [])
    return []

def create_product(product, design_url):
    ptype = get_product_type(product["slug"])
    catalog_id = CATALOG.get(ptype)
    if not catalog_id:
        return None
    
    catalog_variants = get_catalog_variants(catalog_id)
    if not catalog_variants:
        return None
    
    db_variants = get_variants(product["id"])
    target_color = COLOR_OVERRIDE.get(ptype)
    
    sync_variants = []
    used = set()
    
    for db_v in db_variants:
        db_size = db_v["size"]
        mapped_size = SIZE_MAP.get(db_size, db_size)
        
        if mapped_size is None:
            continue  # Skip (e.g. coasters)
        
        # Use the override color since Printful only has limited colors
        match = None
        for cv in catalog_variants:
            if cv.get("color") == target_color and cv.get("size") == mapped_size and cv["id"] not in used:
                match = cv; used.add(cv["id"]); break
        
        if match:
            sync_variants.append({
                "variant_id": match["id"],
                "product_id": catalog_id,
                "files": [{"url": design_url, "placement": "default"}],
                "retail_price": f"{db_v['price']:.2f}",
            })
    
    if not sync_variants:
        # For beanie/mug with only one size option, use the first available variant
        if catalog_variants:
            cv = catalog_variants[0]  # Use first available
            db_v = db_variants[0] if db_variants else None
            if db_v:
                sync_variants.append({
                    "variant_id": cv["id"],
                    "product_id": catalog_id,
                    "files": [{"url": design_url, "placement": "default"}],
                    "retail_price": f"{db_v['price']:.2f}",
                })
    
    if not sync_variants:
        print(f"  ERROR: No matching variants")
        return None
    
    body = {
        "sync_product": {"name": f"Resist N Co - {product['name']}"},
        "sync_variants": sync_variants,
    }
    
    for attempt in range(3):
        resp = requests.post("https://api.printful.com/store/products", headers=HEADERS, json=body)
        if resp.status_code == 200:
            result = resp.json().get("result", {})
            pid = result.get("id")
            nv = result.get("variants", 0)
            print(f"  OK: Printful product {pid} ({nv} variants)")
            return {"product_id": pid, "variants_count": nv}
        elif resp.status_code == 429:
            print(f"  Rate limited, waiting 60s...")
            time.sleep(60)
        else:
            print(f"  ERROR: {resp.status_code} {resp.text[:200]}")
            return None
    return None

def main():
    print("=" * 60)
    print("PRINTFUL SYNC — Tuques, Mugs, Totes")
    print("=" * 60)
    
    products = get_products()
    results = {}
    
    # Only process products that need fixing
    target_slugs = list(DESIGN_MAP.keys())
    
    for p in products:
        if p["slug"] not in target_slugs:
            continue
        
        print(f"\n[{p['id']}] {p['name']} ({p['slug']})")
        filename = DESIGN_MAP.get(p["slug"])
        design_url = f"{GITHUB_RAW}/{filename}"
        
        result = create_product(p, design_url)
        if result:
            results[p["id"]] = result
        time.sleep(4)
    
    print(f"\n{'=' * 60}")
    print(f"RÉSULTAT: {len(results)} produits créés")
    
    # Merge with existing mappings
    existing = {}
    try:
        with open("pod_sync/printful_mappings.json") as f:
            existing = json.load(f)
    except:
        pass
    existing.update(results)
    with open("pod_sync/printful_mappings.json", "w") as f:
        json.dump(existing, f, indent=2)

if __name__ == "__main__":
    main()
