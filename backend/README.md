# API Documentation for AI Safety Analysis Backend

## Overview

This Flask-based API provides endpoints for analyzing images for deepfakes and text for toxicity. The backend utilizes machine learning models to perform these analyses.

## Endpoints

### 1. Detect Deepfakes

**Endpoint**: `/predict-deepfake`  
**Method**: POST  
**Description**: Analyzes an image to detect if it's a deepfake.

**Request**:

- Form data with an image file under the key "image"

**Response**:

```json
{
  "is_deepfake": boolean,
  "confidence": float,
  "filename": string
}
```

### 2. Detect Text Toxicity

**Endpoint**: `/predict-toxicity`  
**Method**: POST  
**Description**: Analyzes text to determine if it contains toxic content.

**Request**:

```json
{
  "text": "text to analyze"
}
```

**Response**:

```json
{
  "text": string,
  "is_toxic": boolean,
  "confidence": float,
  "all_probabilities": {
    "0": float,
    "1": float
  }
}
```

### 3. Upload Image

**Endpoint**: `/images`  
**Method**: POST  
**Description**: Uploads an image to the server.

**Request**:

- Form data with an image file under the key "image"

**Response**:

```json
{
  "success": boolean,
  "message": string,
  "filename": string
}
```

### 4. Retrieve Image

**Endpoint**: `/images/<filename>`  
**Method**: GET  
**Description**: Retrieves a previously uploaded image by its filename.

**Response**: The requested image file or an error message.

## Requirements

- Flask
- NumPy
- PIL (Python Imaging Library)
- TensorFlow
- Transformers (Hugging Face)

## Setup

The application loads machine learning models for deepfake detection and text toxicity analysis from local directories.
