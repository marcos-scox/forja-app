from pathlib import Path

from PIL import Image


TARGETS = [
    "assets/images/icon.png",
    "assets/images/splash-icon.png",
    "assets/images/favicon.png",
    "assets/images/android-icon-foreground.png",
]


def optimize_png(path: Path) -> None:
    with Image.open(path) as source:
        image = source.convert("RGB")
        image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
        optimized = image.quantize(colors=128, method=Image.Quantize.MEDIANCUT)
        optimized.save(path, format="PNG", optimize=True, compress_level=9)


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    for relative_path in TARGETS:
        target = root / relative_path
        optimize_png(target)
        size_kb = target.stat().st_size / 1024
        print(f"{relative_path}: {size_kb:.1f} KB")


if __name__ == "__main__":
    main()
