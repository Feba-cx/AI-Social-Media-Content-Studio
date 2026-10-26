
from pathlib import Path
import openvino_genai as ov_genai
from PIL import Image

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "models" / "dreamlike_anime_ov"
OUTPUT_DIR = BASE_DIR / "static" / "generated_images"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

_pipeline = None


def get_pipeline():
    global _pipeline

    if _pipeline is None:
        if not MODEL_DIR.exists():
            raise RuntimeError("The local image generation model was not found.")

        import openvino as ov

        core = ov.Core()
        device = "GPU" if "GPU" in core.available_devices else "CPU"

        _pipeline = ov_genai.Text2ImagePipeline(
            str(MODEL_DIR),
            device
        )

    return _pipeline


def generate_image(prompt, filename):
    prompt = str(prompt).strip()

    if not prompt:
        raise ValueError("Please enter an image description.")

    pipeline = get_pipeline()

    result = pipeline.generate(
        prompt,
        num_inference_steps=20,
        height=384,
        width=384,
        num_images_per_prompt=1
    )

    image = Image.fromarray(result.data[0])
    output_path = OUTPUT_DIR / filename
    image.save(str(output_path))

    return "/static/generated_images/" + filename
