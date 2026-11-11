import os
from PIL import Image, ImageDraw

def create_pixel_icon(size=512, maskable=False):
    # Canvas size: we design on a 32x32 pixel grid and scale up with Nearest Neighbor
    grid_size = 32
    img = Image.new("RGBA", (grid_size, grid_size), (9, 13, 22, 255)) # #090d16
    draw = ImageDraw.Draw(img)

    # Color palette
    bg = (9, 13, 22, 255)
    border_dark = (15, 23, 42, 255) # Slate 900
    border_glow = (139, 92, 246, 255) # Purple 500 (Aura Points)
    border_inner = (76, 29, 149, 255) # Purple 900
    
    rune_white = (255, 255, 255, 255)
    rune_highlight = (232, 121, 249, 255) # Fuchsia 400
    rune_mid = (168, 85, 247, 255) # Purple 500
    rune_dark = (109, 40, 217, 255) # Purple 700
    gold_sparkle = (234, 179, 8, 255) # Amber 500

    # Draw outer border if not maskable (maskable expects safe area margin)
    margin = 3 if maskable else 1
    
    # Outer frame box
    draw.rectangle([margin, margin, grid_size - 1 - margin, grid_size - 1 - margin], outline=border_dark)
    draw.rectangle([margin + 1, margin + 1, grid_size - 2 - margin, grid_size - 2 - margin], outline=border_glow)
    draw.rectangle([margin + 2, margin + 2, grid_size - 3 - margin, grid_size - 3 - margin], outline=border_inner)

    # Corner pixel brackets for retro RPG feel
    corners = [
        (margin, margin),
        (grid_size - 1 - margin, margin),
        (margin, grid_size - 1 - margin),
        (grid_size - 1 - margin, grid_size - 1 - margin)
    ]
    for cx, cy in corners:
        draw.point((cx, cy), fill=gold_sparkle)

    # Center RPG Glyph: Stylized Aura Crystal / "A" Rune
    # 32x32 center is around (15, 16)
    glyph_pixels = {
        # Apex
        (15, 8): rune_white, (16, 8): rune_white,
        (15, 9): rune_white, (16, 9): rune_highlight,
        
        # Upper angles
        (14, 10): rune_white, (15, 10): rune_highlight, (16, 10): rune_mid, (17, 10): rune_dark,
        (13, 11): rune_white, (14, 11): rune_highlight, (17, 11): rune_mid, (18, 11): rune_dark,
        (12, 12): rune_white, (13, 12): rune_highlight, (18, 12): rune_mid, (19, 12): rune_dark,
        (11, 13): rune_white, (12, 13): rune_highlight, (19, 13): rune_mid, (20, 13): rune_dark,
        
        # Center crossbar & inner crystal chamber
        (10, 14): rune_white, (11, 14): rune_highlight, (20, 14): rune_mid, (21, 14): rune_dark,
        (10, 15): rune_white, (11, 15): rune_mid, (20, 15): rune_mid, (21, 15): rune_dark,
        
        # Crossbar
        (12, 16): rune_highlight, (13, 16): rune_mid, (14, 16): gold_sparkle, (15, 16): gold_sparkle,
        (16, 16): gold_sparkle, (17, 16): gold_sparkle, (18, 16): rune_mid, (19, 16): rune_dark,
        (12, 17): rune_dark, (13, 17): rune_dark, (14, 17): gold_sparkle, (15, 17): rune_white,
        (16, 17): rune_white, (17, 17): gold_sparkle, (18, 17): rune_dark, (19, 17): rune_dark,
        
        # Lower legs
        (9, 16): rune_white, (10, 16): rune_highlight, (21, 16): rune_mid, (22, 16): rune_dark,
        (9, 17): rune_white, (10, 17): rune_highlight, (21, 17): rune_mid, (22, 17): rune_dark,
        (8, 18): rune_white, (9, 18): rune_highlight, (22, 18): rune_mid, (23, 18): rune_dark,
        (8, 19): rune_white, (9, 19): rune_highlight, (22, 19): rune_mid, (23, 19): rune_dark,
        (8, 20): rune_white, (9, 20): rune_highlight, (10, 20): rune_dark,
        (21, 20): rune_mid, (22, 20): rune_dark, (23, 20): rune_dark,
        (7, 21): rune_white, (8, 21): rune_highlight, (9, 21): rune_dark,
        (22, 21): rune_mid, (23, 21): rune_dark, (24, 21): rune_dark,
        (7, 22): rune_white, (8, 22): rune_mid, (9, 22): rune_dark,
        (22, 22): rune_mid, (23, 22): rune_dark, (24, 22): rune_dark,
        
        # Bases / feet
        (6, 23): rune_highlight, (7, 23): rune_mid, (8, 23): rune_dark, (9, 23): rune_dark, (10, 23): rune_dark,
        (21, 23): rune_dark, (22, 23): rune_dark, (23, 23): rune_mid, (24, 23): rune_dark, (25, 23): rune_dark,

        # Floating Aura sparkles around the rune
        (10, 9): gold_sparkle,
        (21, 9): gold_sparkle,
        (6, 15): rune_highlight,
        (25, 15): rune_highlight,
        (15, 5): rune_white, (16, 5): rune_white
    }

    for (x, y), col in glyph_pixels.items():
        if 0 <= x < grid_size and 0 <= y < grid_size:
            draw.point((x, y), fill=col)

    # Upscale using Nearest Neighbor to preserve authentic razor-sharp pixel look
    return img.resize((size, size), Image.Resampling.NEAREST)

def main():
    os.makedirs("public/icons", exist_ok=True)
    
    icon_512 = create_pixel_icon(512, maskable=False)
    icon_512.save("public/icons/icon-512x512.png")
    print("Generated public/icons/icon-512x512.png")

    icon_192 = create_pixel_icon(192, maskable=False)
    icon_192.save("public/icons/icon-192x192.png")
    print("Generated public/icons/icon-192x192.png")

    icon_maskable = create_pixel_icon(512, maskable=True)
    icon_maskable.save("public/icons/icon-512x512-maskable.png")
    print("Generated public/icons/icon-512x512-maskable.png")

    icon_apple = create_pixel_icon(180, maskable=False)
    icon_apple.save("public/icons/apple-touch-icon.png")
    print("Generated public/icons/apple-touch-icon.png")

if __name__ == "__main__":
    main()

