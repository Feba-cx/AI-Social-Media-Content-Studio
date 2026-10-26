
from pathlib import Path
import openvino as ov
import openvino_genai as ov_genai

MODEL_DIR = Path(r"D:\poc\models\dreamlike_anime_ov")
OUTPUT_FILE = Path(r"D:\poc\models\test_generated_image.png")

def main():
    if not MODEL_DIR.exists():
        raise FileNotFoundError(f"Model folder not found: {MODEL_DIR}")

    print("OpenVINO version:", ov.__version__)
    core = ov.Core()
    print("Available devices:", core.available_devices)

    device = "GPU" if "GPU" in core.available_devices else "CPU"
    print("Using device:", device)
    print("Loading image generation model...")

    pipe = ov_genai.Text2ImagePipeline(str(MODEL_DIR), device)

    prompt = (
        "A beautiful modern coffee shop interior, warm natural daylight, "
        "minimal elegant design, professional social media photography"
    )

    print("Generating image. This may take several minutes...")
    image = pipe.generate(
        prompt,
        num_inference_steps=10,
        height=256,
        width=256,
        num_images_per_prompt=1
    )

    image_data = image.data[0]
    from PIL import Image
    Image.fromarray(image_data).save(str(OUTPUT_FILE))

    print("Image saved to:", OUTPUT_FILE)

if __name__ == "__main__":
    main()
