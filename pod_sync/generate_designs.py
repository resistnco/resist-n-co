#!/usr/bin/env python3
"""
Generate print-ready designs for Resist N Co products.
Each design is a transparent PNG at print resolution.
"""
from PIL import Image, ImageDraw, ImageFont
import json
import os

# Design specs per product
DESIGNS = {
    "tshirt-resist": {"text": "RESIST", "subtitle": "Résistez. Organisez-vous.", "colors": ["#D32F2F", "#FFFFFF"]},
    "tshirt-antifascist": {"text": "ANTIFASCIST\nACTION", "subtitle": "No Pasarán", "colors": ["#D32F2F", "#000000"]},
    "tshirt-solidarity": {"text": "SOLIDARITY", "subtitle": "Union fait la force", "colors": ["#D32F2F", "#FFFFFF"]},
    "tshirt-bye-don": {"text": "BYE DON", "subtitle": "Don't let the door hit you", "colors": ["#D32F2F", "#000000"]},
    "tshirt-covfefe": {"text": "COVFEFE\nRESISTANCE\nDEPT.", "subtitle": "Press Secretary (Probably)", "colors": ["#D32F2F", "#FFFFFF"]},
    "tshirt-tiny-hands": {"text": "TINY HANDS\nGIANT LIES", "subtitle": "", "colors": ["#D32F2F", "#000000"]},
    "tshirt-fact-check": {"text": "FACT CHECK\nTHE FEED", "subtitle": "Question Everything", "colors": ["#D32F2F", "#FFFFFF"]},
    "tshirt-no-planet-b": {"text": "NO\nPLANET B", "subtitle": "", "colors": ["#4CAF50", "#FFFFFF"]},
    "hoodie-climate": {"text": "CLIMATE\nJUSTICE", "subtitle": "Act Now or Swim Later", "colors": ["#4CAF50", "#FFFFFF"]},
    "hoodie-nopasaran": {"text": "NO\nPASARÁN", "subtitle": "They Shall Not Pass", "colors": ["#D32F2F", "#000000"]},
    "hoodie-grift-alert": {"text": "GRIFT\nALERT", "subtitle": "", "colors": ["#FF9800", "#000000"]},
    "hoodie-keep-oil": {"text": "KEEP OIL\nIN THE\nGROUND", "subtitle": "", "colors": ["#4CAF50", "#FFFFFF"]},
    "hoodie-no-kings": {"text": "NO KINGS\nNO CON MEN", "subtitle": "", "colors": ["#D32F2F", "#FFFFFF"]},
    "hoodie-not-my-circus": {"text": "NOT MY\nCIRCUS", "subtitle": "Not My Monkeys Either", "colors": ["#D32F2F", "#FFFFFF"]},
    "hoodie-memes": {"text": "MEMES\nAREN'T\nEVIDENCE", "subtitle": "", "colors": ["#D32F2F", "#FFFFFF"]},
    "tuque-power": {"text": "POWER TO\nTHE PEOPLE", "subtitle": "", "colors": ["#D32F2F", "#FFFFFF"]},
    "tuque-truth": {"text": "TRUTH\nMATTERS", "subtitle": "", "colors": ["#D32F2F", "#FFFFFF"]},
    "tuque-question": {"text": "QUESTION\nEVERYTHING", "subtitle": "", "colors": ["#D32F2F", "#FFFFFF"]},
    "tuque-resist-every-day": {"text": "RESIST\nEVERY DAY", "subtitle": "", "colors": ["#D32F2F", "#FFFFFF"]},
    "mug-resist-every-day": {"text": "RESIST\nEVERY DAY", "subtitle": "Resist N Co", "colors": ["#D32F2F", "#FFFFFF"]},
    "mug-defend": {"text": "DEFEND\nTHE EARTH", "subtitle": "No Planet B", "colors": ["#4CAF50", "#FFFFFF"]},
    "coaster-organize": {"text": "ORGANIZE", "subtitle": "", "colors": ["#D32F2F", "#FFFFFF"]},
    "coaster-organize-mobilize": {"text": "ORGANIZE\nMOBILIZE", "subtitle": "", "colors": ["#D32F2F", "#FFFFFF"]},
    "tote-no-planet-b": {"text": "NO\nPLANET B", "subtitle": "Resist N Co", "colors": ["#4CAF50", "#FFFFFF"]},
}

# Print area dimensions per category (at 300 DPI)
PRINT_AREAS = {
    "tshirt": (4500, 5400),
    "hoodie": (4500, 5400),
    "tuque": (2400, 2400),
    "mug": (2400, 1200),
    "coaster": (1500, 1500),
    "tote": (3600, 3600),
}

# Product slug to category mapping
PRODUCT_CATEGORIES = {
    "tshirt-resist": "tshirt", "tshirt-antifascist": "tshirt", "tshirt-solidarity": "tshirt",
    "tshirt-bye-don": "tshirt", "tshirt-covfefe": "tshirt", "tshirt-tiny-hands": "tshirt",
    "tshirt-fact-check": "tshirt", "tshirt-no-planet-b": "tshirt",
    "hoodie-climate": "hoodie", "hoodie-nopasaran": "hoodie", "hoodie-grift-alert": "hoodie",
    "hoodie-keep-oil": "hoodie", "hoodie-no-kings": "hoodie", "hoodie-not-my-circus": "hoodie",
    "hoodie-memes": "hoodie",
    "tuque-power": "tuque", "tuque-truth": "tuque", "tuque-question": "tuque",
    "tuque-resist-every-day": "tuque",
    "mug-resist-every-day": "mug", "mug-defend": "mug",
    "coaster-organize": "coaster", "coaster-organize-mobilize": "coaster",
    "tote-no-planet-b": "tote",
}

def find_font(size):
    """Find a suitable font."""
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for p in font_paths:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

def draw_fist(draw, cx, cy, size, color):
    """Draw a simple raised fist symbol."""
    # Fist body (rectangle)
    fw = size * 0.4
    fh = size * 0.35
    draw.rounded_rectangle(
        [cx - fw//2, cy - fh//2, cx + fw//2, cy + fh//2],
        radius=int(fw*0.15), fill=color
    )
    # Arm (rectangle below fist)
    aw = size * 0.2
    ah = size * 0.3
    draw.rectangle(
        [cx - aw//2, cy + fh//2 - 5, cx + aw//2, cy + fh//2 + ah],
        fill=color
    )
    # Fingers (lines on top of fist)
    for i in range(4):
        fx = cx - fw//2 + (i + 0.5) * fw/4
        draw.rectangle(
            [fx - 3, cy - fh//2 - size*0.08, fx + 3, cy - fh//2 + 5],
            fill=color
        )
    # Thumb
    draw.rectangle(
        [cx - fw//2 - 5, cy - fh//4, cx - fw//2 + 3, cy + fh//4],
        fill=color
    )

def generate_design(slug, spec, category):
    """Generate a print-ready design PNG."""
    width, height = PRINT_AREAS[category]
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    text = spec["text"]
    subtitle = spec.get("subtitle", "")
    main_color = spec["colors"][0]
    accent_color = spec["colors"][1]
    
    # Calculate font size based on text length and canvas
    lines = text.split("\n")
    max_line = max(lines, key=len)
    max_chars = len(max_line)
    
    # Base font size calculation
    if category in ("tshirt", "hoodie"):
        base_size = min(int(width * 0.18), int(height * 0.12))
    elif category == "tuque":
        base_size = int(width * 0.14)
    elif category == "mug":
        base_size = int(height * 0.35)
    elif category == "coaster":
        base_size = int(width * 0.15)
    elif category == "tote":
        base_size = int(width * 0.15)
    else:
        base_size = 200
    
    font = find_font(base_size)
    sub_font = find_font(int(base_size * 0.3)) if subtitle else None
    
    # Calculate total text block height
    line_height = base_size * 1.15
    total_text_height = len(lines) * line_height
    if subtitle:
        total_text_height += line_height * 0.5
    
    # Draw centered text
    y = (height - total_text_height) // 2
    
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        tw = bbox[2] - bbox[0]
        x = (width - tw) // 2
        
        # Draw shadow/outline for visibility on any garment color
        # Draw text in main color
        draw.text((x, y), line, fill=main_color, font=font)
        y += line_height
    
    if subtitle and sub_font:
        y += 10
        bbox = draw.textbbox((0, 0), subtitle, font=sub_font)
        sw = bbox[2] - bbox[0]
        sx = (width - sw) // 2
        draw.text((sx, y), subtitle, fill=accent_color, font=sub_font)
    
    # Add a fist icon for certain designs
    if "resist" in slug or "power" in slug or "solidarity" in slug:
        fist_y = height // 2 - total_text_height // 2 - int(height * 0.08)
        draw_fist(draw, width // 2, fist_y, int(width * 0.06), main_color)
    
    # Save with DPI metadata
    output_path = f"pod_sync/designs/{slug}.png"
    img.save(output_path, "PNG", dpi=(300, 300))
    return output_path

# Generate all designs
generated = []
for slug, spec in DESIGNS.items():
    category = PRODUCT_CATEGORIES.get(slug, "tshirt")
    path = generate_design(slug, spec, category)
    generated.append({"slug": slug, "path": path, "category": category})
    print(f"Generated: {path}")

print(f"\nTotal: {len(generated)} designs generated")

# Save manifest
manifest_path = "pod_sync/design_manifest.json"
with open(manifest_path, "w") as f:
    json.dump(generated, f, indent=2)
print(f"Manifest saved to {manifest_path}")
