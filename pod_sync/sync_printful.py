#!/usr/bin/env python3
"""Sync all 24 products to Printful using GitHub raw URLs for designs."""
import json, os, requests, sqlite3, time

GITHUB_RAW = "https://raw.githubusercontent.com/resistnco/resist-n-co/master/pod_sync/designs"
PRINTFUL_KEY = os.environ.get("PRINTFUL_API_KEY", "")
DB_PATH = "dev.db"
HEADERS = {"Authorization": f"Bearer {PRINTFUL_KEY}", "Content-Type": "application/json"}

DESIGN_MAP = {
    "tshirt-resist": "tshirt-resist.png", "tshirt-antifascist": "tshirt-antifascist.png",
    "tshirt-solidarity": "tshirt-solidarity.png", "hoodie-climate-justice": "hoodie-climate.png",
    "hoodie-no-pasaran": "hoodie-nopasaran.png", "tuque-power-people": "tuque-power.png",
    "mug-defend-earth": "mug-defend.png", "coaster-organize": "coaster-organize.png",
    "tshirt-bye-don": "tshirt-bye-don.png", "tshirt-tiny-hands": "tshirt-tiny-hands.png",
    "tshirt-covfefe": "tshirt-covfefe.png", "tshirt-fact-check": "tshirt-fact-check.png",
    "tshirt-no-planet-b": "tshirt-no-planet-b.png", "hoodie-no-kings": "hoodie-no-kings.png",
    "hoodie-grift-alert": "hoodie-grift-alert.png", "hoodie-not-my-circus": "hoodie-not-my-circus.png",
    "hoodie-keep-oil-ground": "hoodie-keep-oil.png", "hoodie-memes-evidence": "hoodie-memes.png",
    "tuque-truth-matters": "tuque-truth.png", "tuque-question-everything": "tuque-question.png",
    "tuque-resist-every-day": "tuque-resist-every-day.png", "mug-resist-every-day": "mug-resist-every-day.png",
    "coaster-organize-mobilize": "coaster-organize-mobilize.png", "tote-no-planet-b": "tote-no-planet-b.png",
}

def get_product_type(slug):
    if slug.startswith("tshirt"): return "tshirt"
    if slug.startswith("hoodie"): return "hoodie"
    if slug.startswith("tuque"): return "tuque"
    if slug.startswith("mug") or slug.startswith("tasse"): return "mug"
    if slug.startswith("coaster") or slug.startswith("sous-verre"): return "coaster"
    if slug.startswith("tote") or slug.startswith("sac"): return "tote"
    return None

# Printful catalog product IDs (verified working)
PRINTFUL_CATALOG = {
    "tshirt": 71,    # Bella+Canvas 3001
    "hoodie": 145,   # Gildan 18500
    "tuque": 458,    # All-Over Print Beanie
    "mug": 19,       # 11oz Mug
    "tote": 274,     # All-Over Print Large Tote
    "coaster": None, # Not available on Printful
}

# Color mappings: our DB color -> Printful catalog color
COLOR_MAP_TSHIRT = {
    "Black": "Black", "White": "White", "Navy": "Navy",
    "Athletic Heather": "Athletic Heather", "Dark Grey Heather": "Dark Grey Heather",
    "Heather Forest": "Heather Forest", "Maroon": "Maroon",
    "Red": "Red", "Forest": "Forest", "Sport Grey": "Sport Grey",
    "Natural": "Natural", "Dark Heather": "Dark Heather",
}

COLOR_MAP_HOODIE = {
    "Black": "Black", "White": "White", "Navy": "Navy",
    "Dark Heather": "Dark Heather", "Forest": "Forest Green",
    "Maroon": "Maroon", "Red": "Red", "Sport Grey": "Sport Grey",
    "Sand": "Sand", "Charcoal": "Charcoal", "Gold": "Gold",
    "Royal": "Royal", "Orange": "Orange",
}

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
    catalog_id = PRINTFUL_CATALOG.get(ptype)
    if not catalog_id:
        print(f"  SKIP: No Printful catalog for {ptype}")
        return None
    
    catalog_variants = get_catalog_variants(catalog_id)
    if not catalog_variants:
        print(f"  ERROR: No catalog variants for ID {catalog_id}")
        return None
    
    db_variants = get_variants(product["id"])
    color_map = COLOR_MAP_TSHIRT if ptype == "tshirt" else COLOR_MAP_HOODIE if ptype == "hoodie" else {}
    
    sync_variants = []
    used = set()
    
    for db_v in db_variants:
        db_color = color_map.get(db_v["color"], db_v["color"])
        db_size = db_v["size"]
        
        # Find matching variant
        match = None
        for cv in catalog_variants:
            if cv.get("color") == db_color and cv.get("size") == db_size and cv["id"] not in used:
                match = cv; used.add(cv["id"]); break
        
        if not match:
            # Try case-insensitive
            for cv in catalog_variants:
                if cv.get("color", "").lower() == db_color.lower() and cv.get("size") == db_size and cv["id"] not in used:
                    match = cv; used.add(cv["id"]); break
        
        if match:
            placement = "front" if ptype in ("tshirt", "hoodie") else "default"
            sync_variants.append({
                "variant_id": match["id"],
                "product_id": catalog_id,
                "files": [{"url": design_url, "placement": placement}],
                "retail_price": f"{db_v['price']:.2f}",
            })
    
    if not sync_variants:
        print(f"  ERROR: No matching variants (tried {len(db_variants)} DB variants)")
        return None
    
    body = {
        "sync_product": {"name": f"Resist N Co - {product['name']}"},
        "sync_variants": sync_variants,
    }
    
    # Retry on rate limit
    for attempt in range(3):
        resp = requests.post("https://api.printful.com/store/products", headers=HEADERS, json=body)
        if resp.status_code == 200:
            result = resp.json().get("result", {})
            pid = result.get("id")
            nv = result.get("variants", 0)
            print(f"  OK: Printful product {pid} ({nv} variants)")
            return {"product_id": pid, "variants_count": nv}
        elif resp.status_code == 429:
            wait = 60
            print(f"  Rate limited, waiting {wait}s...")
            time.sleep(wait)
        else:
            print(f"  ERROR: {resp.status_code} {resp.text[:200]}")
            return None
    return None

def main():
    print("=" * 60)
    print("PRINTFUL SYNC — 24 produits")
    print("=" * 60)
    
    products = get_products()
    results = {}
    skipped = []
    
    for p in products:
        print(f"\n[{p['id']}/24] {p['name']}")
        filename = DESIGN_MAP.get(p["slug"])
        if not filename:
            print(f"  SKIP: No design file")
            skipped.append(p["id"])
            continue
        
        ptype = get_product_type(p["slug"])
        if ptype == "coaster":
            print(f"  SKIP: Coasters not available on Printful")
            skipped.append(p["id"])
            continue
        
        design_url = f"{GITHUB_RAW}/{filename}"
        result = create_product(p, design_url)
        if result:
            results[p["id"]] = result
        time.sleep(4)  # Rate limit
    
    print(f"\n{'=' * 60}")
    print(f"RÉSULTAT PRINTFUL")
    print(f"{'=' * 60}")
    print(f"Créés: {len(results)}/24")
    print(f"Ignorés: {len(skipped)} (coasters/non disponibles)")
    
    with open("pod_sync/printful_mappings.json", "w") as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    main()
