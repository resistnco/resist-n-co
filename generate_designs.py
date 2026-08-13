#!/usr/bin/env python3
"""
Generate all product designs for Resist N Co.
Creates composed images: AI-generated background art + text overlays via Pillow.
Each design is 1200x1200 (square for POD printing).
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
import subprocess
import json

OUTPUT_DIR = "/home/user/workspace/boutique-perso/client/public/products"
DESIGN_DIR = "/home/user/workspace/designs"
os.makedirs(DESIGN_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ============================================================
# DESIGN DEFINITIONS
# ============================================================

DESIGNS = [
    # --- ANTI-TRUMP (8 designs) ---
    {
        "id": "bye-don",
        "category": "antitrump",
        "title": "BYE DON",
        "subtitle": "2026 — DON'T COME BACK",
        "description": "Logo style: bold red text BYE DON avec un parapluie rouge (symbole de protestation HK) modifié en poing levé. Fond noir.",
        "ai_prompt": "Minimalist graphic illustration on pure black background: a single raised red fist holding a small broken golden crown, centered, no text, clean vector style, high contrast, political protest art",
        "text_lines": [
            {"text": "BYE DON", "size": 180, "color": (211, 47, 47), "y": 400},
            {"text": "DON'T COME BACK", "size": 50, "color": (245, 245, 245), "y": 620},
        ],
        "product_name": "T-Shirt « Bye Don »",
        "product_slug": "tshirt-bye-don",
        "product_desc": "Logo poing levé tenant une couronne brisée, texte BYE DON. Un message clair: on n'en veut plus.",
    },
    {
        "id": "no-kings",
        "category": "antitrump",
        "title": "NO KINGS",
        "subtitle": "NO CON MEN",
        "description": "Logo: couronne renversée avec un poing rouge, texte NO KINGS NO CON MEN.",
        "ai_prompt": "Minimalist graphic on black background: an upside-down golden crown cracked in half, red flames underneath, no text, clean vector illustration style, political art",
        "text_lines": [
            {"text": "NO KINGS", "size": 160, "color": (211, 47, 47), "y": 380},
            {"text": "NO CON MEN", "size": 80, "color": (245, 245, 245), "y": 560},
        ],
        "product_name": "T-Shirt « No Kings, No Con Men »",
        "product_slug": "tshirt-no-kings",
        "product_desc": "Couronne renversée en flammes, texte NO KINGS NO CON MEN. L'Amérique n'est pas une monarchie.",
    },
    {
        "id": "tiny-hands",
        "category": "antitrump",
        "title": "TINY HANDS",
        "subtitle": "GIANT LIES",
        "description": "Logo: petites mains dorées avec un mégaphone qui crache des mensonges.",
        "ai_prompt": "Minimalist graphic on black background: a pair of tiny golden hands holding a megaphone that emits red sound waves, no text, satirical political illustration, vector style",
        "text_lines": [
            {"text": "TINY HANDS", "size": 140, "color": (255, 215, 0), "y": 400},
            {"text": "GIANT LIES", "size": 100, "color": (211, 47, 47), "y": 570},
        ],
        "product_name": "T-Shirt « Tiny Hands, Giant Lies »",
        "product_slug": "tshirt-tiny-hands",
        "product_desc": "Mains dorées tenant un mégaphone, texte TINY HANDS GIANT LIES. La désinformation à l'échelle présidentielle.",
    },
    {
        "id": "covfefe",
        "category": "antitrump",
        "title": "COVFEFE",
        "subtitle": "DEPT. OF RESISTANCE",
        "description": "Logo: tampon officiel rouge 'COVFEFE - DEPT OF RESISTANCE'.",
        "ai_prompt": "Minimalist graphic on black background: a circular red rubber stamp shape with cracked edges, no text inside, clean vector style, official seal look",
        "text_lines": [
            {"text": "COVFEFE", "size": 140, "color": (211, 47, 47), "y": 400},
            {"text": "DEPT. OF", "size": 50, "color": (245, 245, 245), "y": 560},
            {"text": "RESISTANCE", "size": 50, "color": (245, 245, 245), "y": 620},
        ],
        "product_name": "T-Shirt « Covfefe Resistance Dept. »",
        "product_slug": "tshirt-covfefe",
        "product_desc": "Tampon officiel COVFEFE - DEPT OF RESISTANCE. Quand un tweet devient un mouvement.",
    },
    {
        "id": "grift-alert",
        "category": "antitrump",
        "title": "GRIFT ALERT",
        "subtitle": "FOLLOW THE MONEY",
        "description": "Logo: alarme rouge avec signe dollar, texte GRIFT ALERT.",
        "ai_prompt": "Minimalist graphic on black background: a red alarm bell with a green dollar sign inside, warning symbols radiating, no text, vector illustration style, political satire",
        "text_lines": [
            {"text": "GRIFT", "size": 160, "color": (245, 245, 245), "y": 380},
            {"text": "ALERT", "size": 160, "color": (211, 47, 47), "y": 540},
            {"text": "FOLLOW THE MONEY", "size": 40, "color": (76, 175, 80), "y": 720},
        ],
        "product_name": "Hoodie « Grift Alert »",
        "product_slug": "hoodie-grift-alert",
        "product_desc": "Alarme rouge avec signe dollar, texte GRIFT ALERT. Suivez l'argent, toujours.",
    },
    {
        "id": "not-my-circus",
        "category": "antitrump",
        "title": "NOT MY CIRCUS",
        "subtitle": "NOT MY CLOWN",
        "description": "Logo: clown doré barré en rouge, texte NOT MY CIRCUS NOT MY CLOWN.",
        "ai_prompt": "Minimalist graphic on black background: a golden clown mask with a red prohibition circle and slash through it, no text, political satire vector art",
        "text_lines": [
            {"text": "NOT MY", "size": 120, "color": (245, 245, 245), "y": 350},
            {"text": "CIRCUS", "size": 120, "color": (211, 47, 47), "y": 470},
            {"text": "NOT MY CLOWN", "size": 80, "color": (255, 215, 0), "y": 620},
        ],
        "product_name": "Hoodie « Not My Circus »",
        "product_slug": "hoodie-not-my-circus",
        "product_desc": "Masque de clown doré barré, texte NOT MY CIRCUS NOT MY CLOWN. Le cirque présidentaire est annulé.",
    },
    {
        "id": "fact-check",
        "category": "antitrump",
        "title": "FACT CHECK",
        "subtitle": "THE FEED",
        "description": "Logo: loupe rouge sur un écran de téléphone, texte FACT CHECK THE FEED.",
        "ai_prompt": "Minimalist graphic on black background: a large red magnifying glass over a glowing smartphone screen showing broken news icons, no text, digital disinformation concept, vector style",
        "text_lines": [
            {"text": "FACT CHECK", "size": 130, "color": (211, 47, 47), "y": 380},
            {"text": "THE FEED", "size": 100, "color": (245, 245, 245), "y": 530},
            {"text": "VERIFY BEFORE YOU SHARE", "size": 35, "color": (150, 150, 150), "y": 680},
        ],
        "product_name": "T-Shirt « Fact Check the Feed »",
        "product_slug": "tshirt-fact-check",
        "product_desc": "Loupe rouge sur écran de téléphone, texte FACT CHECK THE FEED. La désinformation est une épidémie. Vérifiez avant de partager.",
    },
    {
        "id": "memes-arent-evidence",
        "category": "antitrump",
        "title": "MEMES ≠ EVIDENCE",
        "subtitle": "THINK CRITICALLY",
        "description": "Logo: cerveau rouge avec engrenages, texte MEMES AREN'T EVIDENCE.",
        "ai_prompt": "Minimalist graphic on black background: a red brain shape made of interlocking gears and cogs, half mechanical half organic, no text, critical thinking concept, vector illustration",
        "text_lines": [
            {"text": "MEMES", "size": 130, "color": (211, 47, 47), "y": 370},
            {"text": "≠", "size": 130, "color": (245, 245, 245), "y": 490},
            {"text": "EVIDENCE", "size": 130, "color": (211, 47, 47), "y": 600},
            {"text": "THINK CRITICALLY", "size": 40, "color": (150, 150, 150), "y": 760},
        ],
        "product_name": "T-Shirt « Memes Aren't Evidence »",
        "product_slug": "tshirt-memes-evidence",
        "product_desc": "Cerveau mécanique en engrenages, texte MEMES ≠ EVIDENCE. Un meme n'est pas une source. Pensez critiques.",
    },

    # --- ECOLOGY (2 themes) ---
    {
        "id": "no-planet-b",
        "category": "ecology",
        "title": "NO PLANET B",
        "subtitle": "ACT NOW",
        "description": "Logo: planète Terre verte avec une main qui la protège, texte NO PLANET B.",
        "ai_prompt": "Minimalist graphic on black background: a green and blue Earth globe cradled in protective hands, small green sprout growing from top, no text, climate activism vector art",
        "text_lines": [
            {"text": "NO PLANET B", "size": 120, "color": (76, 175, 80), "y": 400},
            {"text": "ACT NOW", "size": 80, "color": (245, 245, 245), "y": 540},
            {"text": "THERE IS NO BACKUP", "size": 35, "color": (150, 150, 150), "y": 660},
        ],
        "product_name": "T-Shirt « No Planet B »",
        "product_slug": "tshirt-no-planet-b",
        "product_desc": "Planète Terre protégée par des mains, texte NO PLANET B. Il n'y a pas de planète de rechange.",
    },
    {
        "id": "keep-oil-ground",
        "category": "ecology",
        "title": "KEEP OIL",
        "subtitle": "IN THE GROUND",
        "description": "Logo: pipeline barré en rouge avec racines d'arbres, texte KEEP OIL IN THE GROUND.",
        "ai_prompt": "Minimalist graphic on black background: a grey oil pipeline with a red X over it, green tree roots growing around and through the pipe, oil drop cracking, no text, environmental activism vector art",
        "text_lines": [
            {"text": "KEEP OIL", "size": 140, "color": (245, 245, 245), "y": 370},
            {"text": "IN THE", "size": 80, "color": (245, 245, 245), "y": 510},
            {"text": "GROUND", "size": 140, "color": (76, 175, 80), "y": 590},
        ],
        "product_name": "Hoodie « Keep Oil in the Ground »",
        "product_slug": "hoodie-keep-oil-ground",
        "product_desc": "Pipeline barré avec racines d'arbres, texte KEEP OIL IN THE GROUND. L'industrie pétrolière est le problème, pas la solution.",
    },

    # --- DISINFORMATION (2 themes) ---
    {
        "id": "truth-matters",
        "category": "disinformation",
        "title": "TRUTH MATTERS",
        "subtitle": "LIES KILL",
        "description": "Logo: balance rouge avec vérité vs mensonges, texte TRUTH MATTERS.",
        "ai_prompt": "Minimalist graphic on black background: a red and white balance scale tipping toward a glowing truth document, the other side has crumpled fake papers, no text, journalism concept vector art",
        "text_lines": [
            {"text": "TRUTH", "size": 150, "color": (211, 47, 47), "y": 380},
            {"text": "MATTERS", "size": 150, "color": (245, 245, 245), "y": 530},
            {"text": "LIES KILL DEMOCRACY", "size": 38, "color": (150, 150, 150), "y": 700},
        ],
        "product_name": "T-Shirt « Truth Matters »",
        "product_slug": "tshirt-truth-matters",
        "product_desc": "Balance penchée vers la vérité, texte TRUTH MATTERS. Les mensonges tuent la démocratie.",
    },
    {
        "id": "question-everything",
        "category": "disinformation",
        "title": "QUESTION",
        "subtitle": "EVERYTHING",
        "description": "Logo: grand point d'interrogation rouge avec des sources qui se croisent, texte QUESTION EVERYTHING.",
        "ai_prompt": "Minimalist graphic on black background: a large red question mark made of tangled lines and arrows pointing in different directions, representing confusion and information overload, no text, vector illustration",
        "text_lines": [
            {"text": "QUESTION", "size": 120, "color": (211, 47, 47), "y": 380},
            {"text": "EVERYTHING", "size": 100, "color": (245, 245, 245), "y": 510},
            {"text": "VERIFY · CROSS-CHECK · DECIDE", "size": 35, "color": (150, 150, 150), "y": 640},
        ],
        "product_name": "T-Shirt « Question Everything »",
        "product_slug": "tshirt-question-everything",
        "product_desc": "Point d'interrogation en flèches entremêlées, texte QUESTION EVERYTHING. Vérifiez, recoupez, décidez.",
    },

    # --- ACCESSORIES (2 designs) ---
    {
        "id": "resist-mug",
        "category": "accessory",
        "title": "RESIST",
        "subtitle": "EVERY DAY",
        "description": "Logo: poing levé rouge avec RESIST, pour tasse.",
        "ai_prompt": "Minimalist graphic on black background: a single bold red raised fist with a green leaf growing from the wrist, no text, resistance and ecology combined, vector art",
        "text_lines": [
            {"text": "RESIST", "size": 160, "color": (245, 245, 245), "y": 400},
            {"text": "EVERY DAY", "size": 60, "color": (245, 245, 245), "y": 560},
        ],
        "product_name": "Tasse « Resist Every Day »",
        "product_slug": "mug-resist-every-day",
        "product_desc": "Poing levé avec pousse verte, texte RESIST EVERY DAY. Le café du matin pour commencer une journée de résistance.",
    },
    {
        "id": "organize-coaster",
        "category": "accessory",
        "title": "ORGANIZE",
        "subtitle": "MOBILIZE",
        "description": "Logo: mains jointes en cercle, texte ORGANIZE MOBILIZE, pour sous-verre.",
        "ai_prompt": "Minimalist graphic on black background: multiple diverse hands joined together in a circle formation, red and white, solidarity and community organizing concept, no text, vector illustration",
        "text_lines": [
            {"text": "ORGANIZE", "size": 120, "color": (211, 47, 47), "y": 380},
            {"text": "MOBILIZE", "size": 120, "color": (245, 245, 245), "y": 520},
            {"text": "SOLIDARITY", "size": 40, "color": (150, 150, 150), "y": 670},
        ],
        "product_name": "Sous-verre « Organize Mobilize »",
        "product_slug": "coaster-organize-mobilize",
        "product_desc": "Mains jointes en cercle, texte ORGANIZE MOBILIZE. Organisez-vous, mobilisez-vous, solidaires.",
    },
]

# ============================================================
# TEXT RENDERING
# ============================================================

def find_font(size):
    """Find a suitable font for the given size."""
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
    ]
    for p in font_paths:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

def create_design_image(design, ai_image_path=None):
    """Create a composed design: AI background + text overlay."""
    size = 1200
    img = Image.new("RGB", (size, size), (10, 10, 10))

    # If we have an AI-generated image, paste it as background
    if ai_image_path and os.path.exists(ai_image_path):
        ai_img = Image.open(ai_image_path).convert("RGB")
        ai_img = ai_img.resize((size, size), Image.LANCZOS)
        # Darken the AI image for text readability
        overlay = Image.new("RGB", (size, size), (0, 0, 0))
        mask = Image.new("L", (size, size), 120)  # 47% opacity darkening
        img = Image.composite(ai_img, img, Image.new("L", (size, size), 255))
        # Blend: 60% AI image, 40% black
        img = Image.blend(ai_img, img, 0.35)
    else:
        # Create a gradient background
        draw = ImageDraw.Draw(img)
        for y in range(size):
            r = int(10 + (y / size) * 20)
            g = int(10 + (y / size) * 10)
            b = int(10 + (y / size) * 15)
            draw.line([(0, y), (size, y)], fill=(r, g, b))

    # Add semi-transparent dark band behind text area for readability
    text_overlay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    text_draw = ImageDraw.Draw(text_overlay)

    # Draw a dark semi-transparent rectangle behind text area
    min_y = min(l["y"] for l in design["text_lines"]) - 30
    max_y = max(l["y"] + l["size"] for l in design["text_lines"]) + 30
    text_draw.rectangle([50, min_y, size - 50, max_y], fill=(0, 0, 0, 140))

    # Paste the dark band onto the image
    img = img.convert("RGBA")
    img = Image.alpha_composite(img, text_overlay)
    img = img.convert("RGB")

    # Add text
    draw = ImageDraw.Draw(img)
    for line in design["text_lines"]:
        font = find_font(line["size"])
        text = line["text"]
        color = line["color"]
        y = line["y"]

        # Get text bounding box for centering
        bbox = draw.textbbox((0, 0), text, font=font)
        text_w = bbox[2] - bbox[0]
        x = (size - text_w) // 2

        # Draw shadow
        draw.text((x + 3, y + 3), text, font=font, fill=(0, 0, 0))
        # Draw text
        draw.text((x, y), text, font=font, fill=color)

    # Add a border
    border_draw = ImageDraw.Draw(img)
    border_draw.rectangle([0, 0, size-1, size-1], outline=(211, 47, 47), width=4)

    return img

# ============================================================
# MAIN
# ============================================================

def main():
    designs_to_create = DESIGNS
    results = []

    for design in designs_to_create:
        design_path = os.path.join(DESIGN_DIR, f"{design['id']}.png")
        product_path = os.path.join(OUTPUT_DIR, f"{design['product_slug']}.jpg")

        # Check if AI image exists
        ai_path = os.path.join(DESIGN_DIR, f"{design['id']}-ai.png")

        # Create composed design
        img = create_design_image(design, ai_path if os.path.exists(ai_path) else None)
        img.save(design_path, "PNG")
        print(f"✓ Design created: {design['id']} → {design_path}")

        # Create product image (just the design on dark background, saved as jpg)
        img_rgb = img.convert("RGB")
        img_rgb.save(product_path, "JPEG", quality=85)
        print(f"  Product image: {product_path}")

        results.append(design)

    print(f"\n✅ {len(results)} designs created successfully!")
    return results

if __name__ == "__main__":
    main()
