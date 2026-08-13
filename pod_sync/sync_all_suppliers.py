#!/usr/bin/env python3
"""
Sync all 24 products to Printful and Gelato using GitHub raw URLs for design files.
"""
import json, os, requests, sqlite3, time, sys

# === Config ===
GITHUB_RAW = "https://raw.githubusercontent.com/resistnco/resist-n-co/master/pod_sync/designs"
PRINTFUL_KEY = os.environ.get("PRINTFUL_API_KEY", "")
GELATO_KEY = os.environ.get("GELATO_API_KEY", "")
DB_PATH = "dev.db"

PRINTFUL_HEADERS = {"Authorization": f"Bearer {PRINTFUL_KEY}", "Content-Type": "application/json"}
GELATO_HEADERS = {"X-API-KEY": GELATO_KEY, "Content-Type": "application/json"}

# Design file mapping
DESIGN_MAP = {
    "tshirt-resist": "tshirt-resist.png",
    "tshirt-antifascist": "tshirt-antifascist.png",
    "tshirt-solidarity": "tshirt-solidarity.png",
    "hoodie-climate-justice": "hoodie-climate.png",
    "hoodie-no-pasaran": "hoodie-nopasaran.png",
    "tuque-power-people": "tuque-power.png",
    "mug-defend-earth": "mug-defend.png",
    "coaster-organize": "coaster-organize.png",
    "tshirt-bye-don": "tshirt-bye-don.png",
    "tshirt-tiny-hands": "tshirt-tiny-hands.png",
    "tshirt-covfefe": "tshirt-covfefe.png",
    "tshirt-fact-check": "tshirt-fact-check.png",
    "tshirt-no-planet-b": "tshirt-no-planet-b.png",
    "hoodie-no-kings": "hoodie-no-kings.png",
    "hoodie-grift-alert": "hoodie-grift-alert.png",
    "hoodie-not-my-circus": "hoodie-not-my-circus.png",
    "hoodie-keep-oil-ground": "hoodie-keep-oil.png",
    "hoodie-memes-evidence": "hoodie-memes.png",
    "tuque-truth-matters": "tuque-truth.png",
    "tuque-question-everything": "tuque-question.png",
    "tuque-resist-every-day": "tuque-resist-every-day.png",
    "mug-resist-every-day": "mug-resist-every-day.png",
    "coaster-organize-mobilize": "coaster-organize-mobilize.png",
    "tote-no-planet-b": "tote-no-planet-b.png",
}

# Printful catalog product IDs
PRINTFUL_CATALOG = {
    "tshirt": 71,    # Bella+Canvas 3001
    "hoodie": 145,   # Gildan 18500
    "tuque": 261,    # Cuffed Beanie
    "mug": 25,       # 11oz Mug
    "coaster": 607,  # Cork Coaster
    "tote": 240,     # Tote Bag
}

# Color name mappings (our DB -> Printful catalog)
COLOR_MAP = {
    "Black": "Black",
    "White": "White",
    "Navy": "Navy",
    "Dark Grey Heather": "Athletic Heather",
    "Heather Forest": "Forest",
    "Maroon": "Cardinal",
    "Athletic Heather": "Sport Grey",
    "Red": "Red",
    "Dark Heather": "Sport Grey",
    "Forest": "Forest",
    "Sport Grey": "Sport Grey",
    "Natural": "Natural",
    "Charcoal": "Charcoal",
    "Gold": "Gold",
    "Royal": "Royal",
    "Sand": "Sand",
    "Orange": "Orange",
}

def get_products_from_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, slug, category, base_price FROM products ORDER BY id")
    products = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return products

def get_variants_from_db(product_id):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, color, size, color_hex, price FROM product_variants WHERE product_id = ? ORDER BY id", (product_id,))
    variants = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return variants

# === PRINTFUL ===
def printful_upload_design(slug):
    """Upload a design file to Printful via URL"""
    filename = DESIGN_MAP.get(slug)
    if not filename:
        return None
    
    url = f"{GITHUB_RAW}/{filename}"
    resp = requests.post("https://api.printful.com/files", headers=PRINTFUL_HEADERS, json={
        "url": url,
        "type": "default",
        "name": filename
    })
    if resp.status_code == 200:
        file_id = resp.json().get("result", {}).get("id")
        return file_id
    else:
        print(f"  Upload error: {resp.text[:200]}")
        return None

def printful_get_catalog_variants(catalog_id):
    """Get available variants for a Printful catalog product"""
    resp = requests.get(f"https://api.printful.com/products/{catalog_id}", headers=PRINTFUL_HEADERS)
    if resp.status_code == 200:
        return resp.json().get("result", {}).get("variants", [])
    return []

def printful_create_product(product, file_id):
    """Create a product on Printful with all matching variants"""
    category = product["category"]
    catalog_id = PRINTFUL_CATALOG.get(category)
    if not catalog_id:
        print(f"  No catalog ID for category: {category}")
        return None
    
    # Get catalog variants
    catalog_variants = printful_get_catalog_variants(catalog_id)
    if not catalog_variants:
        print(f"  No catalog variants for product {catalog_id}")
        return None
    
    # Get our DB variants
    db_variants = get_variants_from_db(product["id"])
    
    # Match variants
    sync_variants = []
    used_printful_ids = set()
    
    for db_v in db_variants:
        db_color = COLOR_MAP.get(db_v["color"], db_v["color"])
        db_size = db_v["size"]
        
        # Find matching catalog variant
        match = None
        for cv in catalog_variants:
            cv_color = cv.get("color", "")
            cv_size = cv.get("size", "")
            if cv_color == db_color and cv_size == db_size and cv["id"] not in used_printful_ids:
                match = cv
                used_printful_ids.add(cv["id"])
                break
        
        if match:
            retail_price = round(db_v["price"], 2)
            # Determine placement based on category
            if category in ("tshirt", "hoodie"):
                placement = "front"
            elif category == "tuque":
                placement = "front"
            elif category == "mug":
                placement = "default"
            elif category == "tote":
                placement = "default"
            elif category == "coaster":
                placement = "default"
            else:
                placement = "default"
            
            sync_variants.append({
                "variant_id": match["id"],
                "product_id": catalog_id,
                "files": [{"file_id": file_id, "placement": placement}],
                "retail_price": f"{retail_price:.2f}",
            })
    
    if not sync_variants:
        print(f"  No matching variants found")
        return None
    
    # Create the product
    body = {
        "sync_product": {
            "name": f"Resist N Co - {product['name']}",
            "thumbnail": f"{GITHUB_RAW}/{DESIGN_MAP.get(product['slug'])}",
        },
        "sync_variants": sync_variants,
    }
    
    resp = requests.post("https://api.printful.com/store/products", headers=PRINTFUL_HEADERS, json=body)
    if resp.status_code == 200:
        result = resp.json().get("result", {})
        product_id = result.get("sync_product", {}).get("id")
        variants_created = len(result.get("sync_variants", []))
        print(f"  Created Printful product ID: {product_id} ({variants_created} variants)")
        return {"product_id": product_id, "variants": result.get("sync_variants", [])}
    else:
        print(f"  Create error: {resp.text[:300]}")
        return None

def sync_printful():
    """Sync all 24 products to Printful"""
    print("\n" + "=" * 60)
    print("PRINTFUL SYNC")
    print("=" * 60)
    
    products = get_products_from_db()
    results = {}
    
    for product in products:
        print(f"\n[{product['id']}/24] {product['name']} ({product['slug']})")
        
        # Upload design
        file_id = printful_upload_design(product["slug"])
        if not file_id:
            print(f"  FAILED: Could not upload design")
            continue
        print(f"  Uploaded: file_id={file_id}")
        
        # Wait for file processing
        time.sleep(2)
        
        # Create product
        result = printful_create_product(product, file_id)
        if result:
            results[product["id"]] = result
        else:
            print(f"  FAILED: Could not create product")
        
        # Rate limit
        time.sleep(1)
    
    print(f"\nPrintful: {len(results)}/24 products created")
    return results

# === GELATO ===
def sync_gelato():
    """Sync all 24 products to Gelato"""
    print("\n" + "=" * 60)
    print("GELATO SYNC")
    print("=" * 60)
    
    # Test connection
    resp = requests.get("https://api.gelato.com/v2/products", headers=GELATO_HEADERS, params={"limit": 1})
    print(f"Gelato API: {resp.status_code}")
    if resp.status_code != 200:
        print(f"Error: {resp.text[:200]}")
        return {}
    
    # Gelato product creation requires:
    # 1. Upload design file
    # 2. Create a product with the design
    
    products = get_products_from_db()
    results = {}
    
    # Gelato catalog product UIDs (from their catalog)
    gelato_catalog = {
        "tshirt": "apparel-product-gildan-5000",  # Gildan 5000
        "hoodie": "apparel-product-gildan-18500",  # Gildan 18500
        "tuque": "apparel-product-beanie",
        "mug": "product-mug-11oz",
        "tote": "product-tote-bag",
        "coaster": "product-coaster",
    }
    
    for product in products:
        print(f"\n[{product['id']}/24] {product['name']} ({product['slug']})")
        
        filename = DESIGN_MAP.get(product["slug"])
        if not filename:
            continue
        
        design_url = f"{GITHUB_RAW}/{filename}"
        
        # Try to upload design to Gelato
        upload_resp = requests.post("https://api.gelato.com/v2/files", headers=GELATO_HEADERS, json={
            "url": design_url,
            "name": filename,
        })
        
        if upload_resp.status_code == 200 or upload_resp.status_code == 201:
            file_data = upload_resp.json()
            file_id = file_data.get("id") or file_data.get("fileId")
            print(f"  Uploaded: file_id={file_id}")
            
            # Try to create product
            create_resp = requests.post("https://api.gelato.com/v2/products", headers=GELATO_HEADERS, json={
                "name": f"Resist N Co - {product['name']}",
                "designFileId": file_id,
                "productType": gelato_catalog.get(product["category"], "apparel-product-gildan-5000"),
            })
            
            if create_resp.status_code in (200, 201):
                prod_data = create_resp.json()
                prod_id = prod_data.get("id") or prod_data.get("productId")
                print(f"  Created: product_id={prod_id}")
                results[product["id"]] = {"product_id": prod_id}
            else:
                print(f"  Create error: {create_resp.text[:200]}")
        else:
            print(f"  Upload error: {upload_resp.text[:200]}")
        
        time.sleep(1)
    
    print(f"\nGelato: {len(results)}/24 products created")
    return results

# === MAIN ===
if __name__ == "__main__":
    printful_results = sync_printful()
    
    # Save Printful results
    with open("pod_sync/printful_mappings.json", "w") as f:
        json.dump(printful_results, f, indent=2)
    
    gelato_results = sync_gelato()
    
    # Save Gelato results
    with open("pod_sync/gelato_mappings.json", "w") as f:
        json.dump(gelato_results, f, indent=2)
    
    # Summary
    print("\n" + "=" * 60)
    print("SYNC SUMMARY")
    print("=" * 60)
    print(f"Printify: 24/24 (already synced)")
    print(f"Printful:  {len(printful_results)}/24")
    print(f"Gelato:   {len(gelato_results)}/24")
