#!/usr/bin/env python3
"""Map all 24 products to Gelato productUids with proper print type filtering."""
import json, os, requests, sqlite3, time

GELATO_KEY = os.environ.get("GELATO_API_KEY", "")
HEADERS = {"X-API-KEY": GELATO_KEY, "Content-Type": "application/json"}
DB_PATH = "dev.db"

def search_apparel(filters):
    resp = requests.post("https://product.gelatoapis.com/v3/catalogs/apparel/products:search",
                        headers=HEADERS, json={"attributeFilters": filters})
    if resp.status_code == 200:
        return resp.json().get("products", [])
    return []

def search_mugs():
    resp = requests.post("https://product.gelatoapis.com/v3/catalogs/mugs/products:search",
                        headers=HEADERS, json={})
    if resp.status_code == 200:
        return resp.json().get("products", [])
    return []

def get_products():
    conn = sqlite3.connect(DB_PATH); conn.row_factory = sqlite3.Row
    rows = conn.execute("SELECT id, name, slug, category FROM products ORDER BY id").fetchall()
    conn.close(); return [dict(r) for r in rows]

def get_variants(pid):
    conn = sqlite3.connect(DB_PATH); conn.row_factory = sqlite3.Row
    rows = conn.execute("SELECT id, color, size FROM product_variants WHERE productId = ? ORDER BY id", (pid,)).fetchall()
    conn.close(); return [dict(r) for r in rows]

def pick_best_uid(uids):
    """Pick the simplest productUid (fewest print options)."""
    if not uids:
        return None
    # Prefer "gpr_4-0" (simple front print, no DTF/embroidery variants)
    for u in uids:
        if "gpr_4-0_bella-and-canvas" in u:
            return u
    for u in uids:
        if "gpr_4-0_gildan" in u:
            return u
    for u in uids:
        if "gpr_4-0_" in u:
            return u
    return uids[0]

def build_tshirt_map():
    """Build color/size -> productUid for Bella+Canvas 3001"""
    tshirt_map = {}
    colors = ["black", "white", "navy", "athletic-heather", "dark-grey-heather",
              "heather-forest", "maroon", "red", "forest", "natural",
              "gold", "orange", "dark-grey"]
    
    for color in colors:
        products = search_apparel({
            "ApparelManufacturerSKU": "3001",
            "GarmentColor": color,
            "GarmentPrint": "4-0"
        })
        for p in products:
            attrs = p.get("attributes", {})
            size = attrs.get("GarmentSize", "")
            uid = p.get("productUid", "")
            key = f"{color}/{size}"
            if key not in tshirt_map:
                tshirt_map[key] = []
            tshirt_map[key].append(uid)
        time.sleep(0.5)
    
    # Pick best
    return {k: pick_best_uid(v) for k, v in tshirt_map.items()}

def build_hoodie_map():
    """Build color/size -> productUid for Gildan 18500"""
    hoodie_map = {}
    colors = ["black", "white", "navy", "dark-heather", "forest-green",
              "maroon", "red", "sport-grey", "sand", "charcoal",
              "gold", "royal", "orange"]
    
    for color in colors:
        products = search_apparel({
            "ApparelManufacturerSKU": "18500",
            "GarmentColor": color,
            "GarmentPrint": "4-0"
        })
        for p in products:
            attrs = p.get("attributes", {})
            size = attrs.get("GarmentSize", "")
            uid = p.get("productUid", "")
            key = f"{color}/{size}"
            if key not in hoodie_map:
                hoodie_map[key] = []
            hoodie_map[key].append(uid)
        time.sleep(0.5)
    
    return {k: pick_best_uid(v) for k, v in hoodie_map.items()}

def build_beanie_map():
    """Build color/size -> productUid for beanies"""
    beanie_map = {}
    products = search_apparel({"GarmentSubcategory": "beanie"})
    for p in products:
        attrs = p.get("attributes", {})
        color = attrs.get("GarmentColor", "")
        size = attrs.get("GarmentSize", "")
        uid = p.get("productUid", "")
        key = f"{color}/{size}"
        if key not in beanie_map:
            beanie_map[key] = uid
    return beanie_map

def build_mug_map():
    """Build size -> productUid for mugs"""
    mug_map = {}
    products = search_mugs()
    for p in products:
        attrs = p.get("attributes", {})
        size = attrs.get("MugSize", "")
        material = attrs.get("MugMaterial", "")
        uid = p.get("productUid", "")
        if "11" in size:
            if "white" in material:
                mug_map["white"] = uid
            elif "black" in material:
                mug_map["black"] = uid
    return mug_map

def main():
    print("=" * 60)
    print("GELATO FULL PRODUCT MAPPING")
    print("=" * 60)
    
    print("\n=== Building t-shirt map (Bella+Canvas 3001) ===")
    tshirt_map = build_tshirt_map()
    print(f"  {len(tshirt_map)} color/size combos")
    
    print("\n=== Building hoodie map (Gildan 18500) ===")
    hoodie_map = build_hoodie_map()
    print(f"  {len(hoodie_map)} color/size combos")
    
    print("\n=== Building beanie map ===")
    beanie_map = build_beanie_map()
    print(f"  {len(beanie_map)} color/size combos")
    
    print("\n=== Building mug map ===")
    mug_map = build_mug_map()
    print(f"  {mug_map}")
    
    # Color mapping: our DB -> Gelato
    COLOR_MAP = {
        "Black": "black", "White": "white", "Navy": "navy",
        "Athletic Heather": "athletic-heather", "Dark Grey Heather": "dark-grey-heather",
        "Heather Forest": "heather-forest", "Maroon": "maroon",
        "Red": "red", "Forest": "forest", "Sport Grey": "sport-grey",
        "Natural": "natural", "Dark Heather": "dark-heather",
        "Burgundy": "maroon", "Forest Green": "forest-green",
        "Charcoal": "charcoal", "Gold": "gold", "Royal": "royal",
        "Orange": "orange", "Sand": "sand", "Dark Grey": "dark-grey",
        "Pepper": "dark-grey", "Natural Cork": "natural",
    }
    
    # Build variant mappings
    print("\n" + "=" * 60)
    print("BUILDING VARIANT MAPPINGS")
    print("=" * 60)
    
    db_products = get_products()
    gelato_mappings = {}
    
    for p in db_products:
        slug = p["slug"]
        variants = get_variants(p["id"])
        mapped = 0
        
        for v in variants:
            color = COLOR_MAP.get(v["color"], v["color"].lower().replace(" ", "-"))
            size = v["size"]
            
            uid = None
            if slug.startswith("tshirt"):
                uid = tshirt_map.get(f"{color}/{size}")
            elif slug.startswith("hoodie"):
                uid = hoodie_map.get(f"{color}/{size}")
            elif slug.startswith("tuque"):
                uid = beanie_map.get(f"{color}/onesize") or beanie_map.get(f"{color}/{size}")
            elif slug.startswith("mug") or slug.startswith("tasse"):
                # Use white mug for white, black mug for others
                mug_color = "white" if v["color"] == "White" else "black"
                uid = mug_map.get(mug_color)
            
            if uid:
                key = f"{p['id']}:{v['id']}"
                gelato_mappings[key] = uid
                mapped += 1
        
        status = f"{mapped}/{len(variants)}" if variants else "0/0"
        print(f"  [{p['id']:2d}] {p['name'][:40]:40s} {status}")
    
    with open("pod_sync/gelato_product_uids.json", "w") as f:
        json.dump(gelato_mappings, f, indent=2)
    
    total = len(gelato_mappings)
    print(f"\n{'=' * 60}")
    print(f"TOTAL: {total} variant→productUid mappings")

if __name__ == "__main__":
    main()
