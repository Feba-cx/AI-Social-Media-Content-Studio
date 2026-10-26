
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from pathlib import Path
from services.ai_service import generate_social_content
import json
import uuid
import requests

load_dotenv()

app = Flask(__name__)

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DRAFTS_FILE = DATA_DIR / "drafts.json"
APPROVALS_FILE = DATA_DIR / "approvals.json"

DATA_DIR.mkdir(exist_ok=True)


def read_drafts():
    try:
        with open(DRAFTS_FILE, "r", encoding="utf-8") as file:
            data = json.load(file)
            return data if isinstance(data, list) else []
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def write_drafts(drafts):
    with open(DRAFTS_FILE, "w", encoding="utf-8") as file:
        json.dump(drafts, file, indent=4, ensure_ascii=False)



def read_approvals():
    try:
        with open(APPROVALS_FILE, "r", encoding="utf-8") as file:
            data = json.load(file)
            return data if isinstance(data, list) else []
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def write_approvals(approvals):
    with open(APPROVALS_FILE, "w", encoding="utf-8") as file:
        json.dump(approvals, file, indent=4, ensure_ascii=False)




@app.route("/")
def dashboard():
    return render_template("index.html")


@app.route("/content-studio")
def content_studio():
    return render_template("content_studio.html")


@app.route("/drafts")
def drafts_page():
    return render_template("drafts.html")


@app.route("/api/drafts", methods=["GET"])
def get_drafts():
    return jsonify(read_drafts())


@app.route("/api/drafts", methods=["POST"])
def save_draft():
    data = request.get_json(silent=True) or {}

    content = str(data.get("content", "")).strip()
    if not content:
        return jsonify({"error": "Content cannot be empty."}), 400

    drafts = read_drafts()
    draft_id = str(data.get("id") or uuid.uuid4())

    draft = {
        "id": draft_id,
        "title": str(data.get("title") or "Untitled Draft"),
        "type": str(data.get("type") or "Social media post"),
        "platform": str(data.get("platform") or "General"),
        "content": content
    }

    # Update an existing draft instead of creating a duplicate.
    for index, existing in enumerate(drafts):
        if existing.get("id") == draft_id:
            drafts[index] = draft
            break
    else:
        drafts.insert(0, draft)

    write_drafts(drafts)
    return jsonify({"message": "Draft saved successfully.", "id": draft_id})





@app.route("/api/drafts/<draft_id>", methods=["DELETE"])
def delete_draft(draft_id):
    drafts = read_drafts()

    updated_drafts = [
        draft for draft in drafts
        if draft.get("id") != draft_id
    ]

    if len(updated_drafts) == len(drafts):
        return jsonify({"error": "Draft not found."}), 404

    write_drafts(updated_drafts)

    return jsonify({
        "message": "Draft deleted successfully.",
        "id": draft_id
    })




@app.route("/api/generate", methods=["POST"])
def generate_content():
    data = request.get_json(silent=True) or {}

    topic = str(data.get("topic", "")).strip()
    content_type = str(
        data.get("content_type", "Social media post")
    ).strip()
    platform = str(data.get("platform", "Instagram")).strip()
    tone = str(data.get("tone", "Professional")).strip()
    length = str(data.get("length", "Medium")).strip()

    if not topic:
        return jsonify({"error": "Please enter a topic."}), 400

    try:
        content = generate_social_content(
            topic=topic,
            content_type=content_type,
            platform=platform,
            tone=tone,
            length=length
        )

        return jsonify({
            "content": content,
            "content_type": content_type,
            "platform": platform,
            "tone": tone,
            "prototype": True,
            "provider": "local",
            "model": "qwen2.5:3b"
        })

    except RuntimeError as error:
        return jsonify({"error": str(error)}), 503



@app.route("/api/generate-image", methods=["POST"])
def generate_image_proxy():
    data = request.get_json(silent=True) or {}
    prompt = str(data.get("prompt", "")).strip()

    if not prompt:
        return jsonify({"error": "Please enter an image description."}), 400

    try:
        response = requests.post(
            "http://127.0.0.1:5001/generate-image",
            json={"prompt": prompt},
            timeout=300
        )

        result = response.json()

        if response.status_code != 200:
            return jsonify(result), response.status_code

        return jsonify({
            "image_url": result["image_url"]
        })

    except requests.exceptions.RequestException:
        return jsonify({
            "error": "Image service is not running. Start image_api.py first."
        }), 503




@app.route("/api/generate-audio", methods=["POST"])
def generate_audio_proxy():
    data = request.get_json(silent=True) or {}
    text = str(data.get("text", "")).strip()

    if not text:
        return jsonify({
            "error": "Please enter text to convert to speech."
        }), 400

    try:
        response = requests.post(
            "http://127.0.0.1:5002/generate-audio",
            json={"text": text},
            timeout=300
        )

        result = response.json()

        if response.status_code != 200:
            return jsonify(result), response.status_code

        return jsonify({
            "audio_url": result["audio_url"]
        })

    except requests.exceptions.RequestException:
        return jsonify({
            "error": "Audio service is not running. Start audio_api.py first."
        }), 503



@app.route("/trends")
def trends():
    return render_template("trends.html")


@app.route("/approvals")
def approvals_page():
    return render_template("approvals.html")


@app.route("/api/trends", methods=["GET"])
def get_trends():
    # Demo data only; these are not verified live trends.
    trends = [
        {
            "id": "trend-1",
            "topic": "AI tools for everyday productivity",
            "category": "Technology",
            "relevance": 95,
            "reason": "Useful tips and practical AI applications"
        },
        {
            "id": "trend-2",
            "topic": "Sustainable business practices",
            "category": "Business",
            "relevance": 88,
            "reason": "Shareable ideas about responsible business"
        },
        {
            "id": "trend-3",
            "topic": "Behind the scenes at work",
            "category": "Workplace",
            "relevance": 82,
            "reason": "Human stories that help audiences connect"
        }
    ]
    return jsonify({
        "demo": True,
        "message": "Sample topics for demonstration, not live trend data.",
        "trends": trends
    })


@app.route("/api/approvals", methods=["GET"])
def get_approvals():
    return jsonify(read_approvals())



@app.route("/api/approvals", methods=["POST"])
def create_approval():
    data = request.get_json(silent=True) or {}

    title = str(data.get("title", "")).strip()
    content = str(data.get("content", "")).strip()
    platform = str(data.get("platform", "Instagram")).strip()
    image_url = str(data.get("image_url", "")).strip()
    draft_id = str(data.get("draft_id", "")).strip()

    if not content:
        return jsonify({"error": "Content cannot be empty."}), 400

    approvals = read_approvals()

    # Prevent the same draft from being submitted twice
    # while it is already awaiting review.
    if draft_id:
        for existing in approvals:
            if (
                existing.get("draft_id") == draft_id
                and existing.get("status") == "Pending"
            ):
                return jsonify({
                    "error": "This draft is already awaiting approval."
                }), 409

    from datetime import datetime

    post = {
        "id": str(uuid.uuid4()),
        "draft_id": draft_id or None,
        "title": title or "Untitled social post",
        "content": content,
        "platform": platform,
        "image_url": image_url,
        "status": "Pending",
        "created_at": datetime.now().isoformat(timespec="seconds")
    }

    approvals.insert(0, post)
    write_approvals(approvals)

    return jsonify({
        "message": "Post submitted for approval.",
        "post": post
    }), 201



@app.route("/api/approvals/<post_id>", methods=["PATCH"])
def update_approval(post_id):
    data = request.get_json(silent=True) or {}
    action = str(data.get("action", "")).strip().lower()

    status_map = {
        "approve": "Approved",
        "reject": "Rejected"
    }

    if action not in status_map:
        return jsonify({
            "error": "Action must be approve or reject."
        }), 400

    approvals = read_approvals()

    for post in approvals:
        if post.get("id") == post_id:
            if post.get("status") != "Pending":
                return jsonify({
                    "error": "Only pending posts can be reviewed."
                }), 409

            post["status"] = status_map[action]
            write_approvals(approvals)

            return jsonify({
                "message": f"Post {post['status'].lower()}.",
                "post": post
            })

    return jsonify({"error": "Post not found."}), 404




if __name__ == "__main__":
    app.run(debug=True)
