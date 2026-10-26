
from flask import Flask, request, jsonify
from pathlib import Path
import sys
import uuid
import traceback

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from services.image_service import generate_image

app = Flask(__name__)


@app.route("/generate-image", methods=["POST"])
def generate():
    data = request.get_json(silent=True) or {}
    prompt = str(data.get("prompt", "")).strip()

    if not prompt:
        return jsonify({"error": "Please enter an image description."}), 400

    filename = str(uuid.uuid4()) + ".png"

    try:
        image_url = generate_image(prompt, filename)
        return jsonify({"image_url": image_url})

    except Exception:
        traceback.print_exc()
        return jsonify({
            "error": "Image generation failed. Check the image API terminal."
        }), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=False, threaded=False)
