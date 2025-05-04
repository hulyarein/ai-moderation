# AI Moderation API Documentation

This API provides moderation services for detecting deepfake images and toxic text content.

## Base URL

```
http://localhost:8002
```

## Endpoints

### Health Check

Verify that the API is running.

```
GET /
```

#### Response

```json
{
  "status": "success",
  "message": "AI Moderation API is running"
}
```

### Detect Deepfake from File Upload

Analyze an image file to determine if it's a deepfake.

```
POST /predict-deepfake
```

#### Request

- Content-Type: `multipart/form-data`
- Body:
  - `image`: Image file to analyze

#### Response

```json
{
  "is_deepfake": true|false,
  "confidence": 0.95, // Value between 0-1
  "filename": "example.jpg"
}
```

### Detect Deepfake from URL

Analyze an image from a URL to determine if it's a deepfake.

```
POST /predict-deepfake-url
```

#### Request

- Content-Type: `application/json`
- Body:

  ```json
  {
    "image_url": "https://example.com/image.jpg"
  }
  ```

#### Response

```json
{
  "is_deepfake": true|false,
  "confidence": 0.95, // Value between 0-1
  "image_url": "https://example.com/image.jpg"
}
```

### Detect Toxic Text

Analyze text to determine if it contains toxic content.

```
POST /predict-toxicity
```

#### Request

- Content-Type: `application/json`
- Body:

  ```json
  {
    "text": "Text content to analyze"
  }
  ```

#### Response

```json
{
  "text": "Text content to analyze",
  "is_toxic": true|false,
  "confidence": 0.95, // Value between 0-1
  "all_probabilities": {
    "0": 0.05, // Non-toxic probability
    "1": 0.95  // Toxic probability
  }
}
```

### Upload Image

Upload an image to the server.

```
POST /images
```

#### Request

- Content-Type: `multipart/form-data`
- Body:
  - `image`: Image file to upload

#### Response

```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "filename": "3f2a8d4e7b9c1f5e6a3d2c1b5a4e3d2c.jpg"
}
```

### Retrieve Image

Get a previously uploaded image.

```
GET /images/<filename>
```

#### Parameters

- `filename`: Name of the uploaded image file

#### Response

- The requested image file
- Status code 404 if the image is not found

## Error Responses

All endpoints return appropriate HTTP status codes and error messages:

- 400: Bad Request (missing or invalid parameters)
- 404: Not Found
- 500: Internal Server Error

Example error response:

```json
{
  "error": "Error message details"
}
```
