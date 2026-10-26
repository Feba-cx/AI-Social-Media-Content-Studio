
import requests

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
MODEL_NAME = "qwen2.5:3b"


def generate_social_content(
    topic,
    content_type="Social media post",
    platform="Instagram",
    tone="Professional",
    length="Medium"
):
    prompt = f"""
You are an expert social media content creator.

Create original content using these details:
Topic: {topic}
Content type: {content_type}
Platform: {platform}
Tone: {tone}
Length: {length}

Requirements:
- Write naturally and engagingly.
- Adapt the content to the platform.
- Avoid repetitive, generic filler.
- Include relevant hashtags when appropriate.
- Do not invent statistics or testimonials.
- Return only the requested content.
"""

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL_NAME,
                "prompt": prompt,
                "stream": False
            },
            timeout=180
        )
        response.raise_for_status()

        content = response.json().get("response", "").strip()

        if not content:
            raise RuntimeError("The AI model returned empty content.")

        return content

    except requests.exceptions.ConnectionError as exc:
        raise RuntimeError(
            "Ollama is not running. Please open Ollama and try again."
        ) from exc

    except requests.exceptions.Timeout as exc:
        raise RuntimeError(
            "AI generation timed out. Please try a shorter request."
        ) from exc

    except requests.exceptions.RequestException as exc:
        raise RuntimeError(
            "Could not communicate with Ollama. Check the local model."
        ) from exc
