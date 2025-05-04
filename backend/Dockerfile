# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire app
COPY . .

# Expose the port Flask runs on
EXPOSE 8002

# Run the Flask app using Gunicorn with 4 workers (adjust workers as necessary)
CMD ["gunicorn", "--workers", "16", "--bind", "0.0.0.0:8002", "app:app"]
