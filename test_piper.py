
import wave
from piper import PiperVoice

model_path = r"D:\poc\models\piper\en_US-lessac-medium.onnx"
output_path = r"D:\poc\models\test_audio.wav"

print("Loading Piper voice...")
voice = PiperVoice.load(model_path)

print("Generating speech...")
with wave.open(output_path, "wb") as wav_file:
    voice.synthesize_wav(
        "Hello! This is a test of our local AI content creation system."
        , wav_file
    )

print(f"Audio generated successfully: {output_path}")
