from flask import Flask, request, jsonify
import numpy as np
from PIL import Image
import os
import io
import uuid

from transformers import AutoTokenizer

from tensorflow.saved_model import load
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.preprocessing.text import tokenizer_from_json

app = Flask(__name__)


try:
    deepfake_model = load_model("./models/deepfake-classifier/deepfake_detect.keras")

    # Load the tokenizer
    toxicity_tokenizer = AutoTokenizer.from_pretrained(
        "./models/text-classifier/tinybert_text_classifier_tokenizer/"
    )

    # Load the model (assuming TensorFlow SavedModel format)
    toxicity_model = load("./models/text-classifier/tinybert_text_classifier_model/")


except Exception as e:
    print(f"Error loading models: {e}")


@app.route("/predict-deepfake", methods=["POST"])
def predict_deepfake():
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    try:
        # Get the image from request
        image_file = request.files["image"]
        image = Image.open(io.BytesIO(image_file.read()))

        # Preprocess the image
        image = image.resize(
            (224, 224)
        )  # Adjust size according to your model's requirements
        image_array = img_to_array(image)
        image_array = image_array / 255.0  # Normalize
        image_array = np.expand_dims(image_array, axis=0)

        # Make prediction
        prediction = deepfake_model.predict(image_array)[0][0]
        is_deepfake = not bool(prediction > 0.9)

        return jsonify(
            {
                "is_deepfake": is_deepfake,
                "confidence": float(prediction),
                "filename": image_file.filename,
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/predict-toxicity", methods=["POST"])
def predict_toxicity():
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "No text provided"}), 400

    try:
        text = data["text"]
        max_length = 128

        # Tokenize the text
        inputs = toxicity_tokenizer(
            text,
            padding="max_length",
            truncation=True,
            max_length=max_length,
            return_tensors="tf",
        )

        # Make prediction
        prediction = toxicity_model(
            {
                "input_ids": inputs["input_ids"],
                "attention_mask": inputs["attention_mask"],
            }
        )
        predicted_class = np.argmax(prediction, axis=1)[0]
        confidence = prediction[0][predicted_class]

        return jsonify(
            {
                "text": text,
                "is_toxic": bool(predicted_class),
                "confidence": float(confidence),
                "all_probabilities": {
                    i: float(prob) for i, prob in enumerate(prediction[0])
                },
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/images", methods=["POST"])
def upload_image():
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    try:
        image_file = request.files["image"]
        if image_file.filename == "":
            return jsonify({"error": "No selected file"}), 400

        ext = os.path.splitext(str(image_file.filename))[1]  # Get original extension
        filename = f"{uuid.uuid4().hex}{ext}"  # Generate UUID-based filename

        upload_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
        os.makedirs(upload_dir, exist_ok=True)

        # Save the file
        file_path = os.path.join(upload_dir, str(filename))
        image_file.save(file_path)

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Image uploaded successfully",
                    "filename": filename,
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/images/<filename>", methods=["GET"])
def get_image(filename):
    from flask import send_from_directory

    try:
        upload_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
        return send_from_directory(upload_dir, filename)
    except Exception as e:
        return jsonify({"error": str(e)}), 404


@app.route("/", methods=["GET"])
def test_route():
    return (
        jsonify({"status": "success", "message": "AI Moderation API is running"}),
        200,
    )


if __name__ == "__main__":
    app.run(debug=True)
