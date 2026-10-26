
from flask import Flask, request, jsonify
from pathlib import Path
import wave
import uuid
from piper import PiperVoice

app = Flask(__name__)

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "piper" / "en_US-lessac-medium.onnx"
AUDIO_DIR = BASE_DIR / "static" / "generated_audio"

AUDIO_DIR.mkdir(parents=True, exist_ok=True)

voice = None


@app.route("/generate-audio", methods=["POST"])
def generate_audio():
    global voice

    data = request.get_json(silent=True) or {}
    text = str(data.get("text", "")).strip()

    if not text:
        return jsonify({"error": "Please enter text to convert to speech."}), 400

    if len(text) > 5000:
        return jsonify({"error": "Text must be 5000 characters or fewer."}), 400

    try:
        if voice is None:
            voice = PiperVoice.load(str(MODEL_PATH))

        filename = f"voice_{uuid.uuid4().hex}.wav"
        output_path = AUDIO_DIR / filename

        with wave.open(str(output_path), "wb") as wav_file:
            voice.synthesize_wav(text, wav_file)

        return jsonify({
            "audio_url": f"/static/generated_audio/{filename}"
        })

    except Exception as error:
        app.logger.exception("Audio generation failed")
        return jsonify({"error": str(error)}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5002, debug=False)
