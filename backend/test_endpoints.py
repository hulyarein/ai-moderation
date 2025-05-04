import requests
import json
from PIL import Image
import io

FAKE_IMAGE_PATH = "assets/fake_0.jpg"
REAL_IMAGE_PATH = "assets/real_0.jpg"


# Test deepfake endpoint
def test_deepfake_endpoint(img):
    url = "http://localhost:5000/predict-deepfake"

    # Open an image file
    with open(img, "rb") as img_file:
        files = {"image": img_file}
        response = requests.post(url, files=files)

    print("Deepfake Prediction Response:")
    print(response.json())
    return response.json()


# Test toxicity endpoint
def test_toxicity_endpoint():
    url = "http://localhost:5000/predict-toxicity"

    data = {"text": "This is a sample text to test the toxicity model."}
    headers = {"Content-Type": "application/json"}

    response = requests.post(url, data=json.dumps(data), headers=headers)

    print("Toxicity Prediction Response:")
    print(response.json())
    return response.json()


def test_upload_image(img_path, filename=None):
    url = "http://localhost:5000/upload-image"

    with open(img_path, "rb") as img_file:
        files = {"image": img_file}
        data = {}
        if filename:
            data["filename"] = filename

        response = requests.post(url, files=files, data=data)

    print("Image Upload Response:")
    print(response.json())
    return response.json()


if __name__ == "__main__":
    print("Testing deepfake endpoint...")
    test_deepfake_endpoint(FAKE_IMAGE_PATH)

    print("Testing deepfake endpoint...")
    test_deepfake_endpoint(REAL_IMAGE_PATH)

    print("\nTesting toxicity endpoint...")
    test_toxicity_endpoint()

    print("\nTesting image upload endpoint...")
    upload_result = test_upload_image(FAKE_IMAGE_PATH, "uploaded_fake.jpg")

    if upload_result.get("success"):
        print(
            f"\nYou can view the image at: http://localhost:5000/get-image/{upload_result['filename']}"
        )
