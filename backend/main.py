from flask import Flask, request, jsonify
import numpy as np
from PIL import Image
import json
import os
import io

from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.preprocessing.text import tokenizer_from_json

app = Flask(__name__)

# Load models
try:
    deepfake_model = load_model("./models/deepfake-classifier/deepfake_detect.keras")

    with open(
        "./models/text-classifier/tinybert_text_classifier_tokenizer/tokenizer.json"
    ) as f:
        toxicity_tokenizer = tokenizer_from_json(json.load(f))

    toxicity_model = load_model(
        "./models/text-classifier/tinybert_text_classifier_model/saved_model.pb"
    )

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
        prediction = deepfake_model.predict(image_array)
        is_deepfake = bool(prediction[0][0] > 0.5)

        return jsonify({"is_deepfake": is_deepfake})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/predict-toxicity", methods=["POST"])
def predict_toxicity():
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "No text provided"}), 400

    try:
        text = data["text"]

        # Preprocess text
        sequence = toxicity_tokenizer.texts_to_sequences([text])
        padded_sequence = pad_sequences(
            sequence, maxlen=100
        )  # Adjust maxlen according to your model

        # Make prediction
        prediction = toxicity_model.predict(padded_sequence)
        is_toxic = bool(prediction[0][0] > 0.5)

        return jsonify({"is_toxic": is_toxic})

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

        # Check if a filename was provided in the form data
        filename = request.form.get("filename")
        if not filename:
            # Use original filename if none provided
            filename = image_file.filename

        upload_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
        os.makedirs(upload_dir, exist_ok=True)

        # Save the file
        file_path = os.path.join(upload_dir, filename)
        image_file.save(file_path)

        return jsonify(
            {
                "success": True,
                "message": "Image uploaded successfully",
                "filename": filename,
                "path": file_path,
            }
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


if __name__ == "__main__":
    app.run(debug=True)
