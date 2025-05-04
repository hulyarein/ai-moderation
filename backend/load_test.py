import requests
import concurrent.futures
import time

# The URL you want to test
# url = "https://aliac-ai-moderation-backend.wetooa.me/predict-deepfake-url"

# The data to be passed in the POST request
# data = {
#     "image_url": "https://fastly.picsum.photos/id/260/200/300.jpg?hmac=_VpBxDn0zencTyMnssCV14LkW80zG7vw2rw7WCQ2uVo"
# }


# The URL you want to test
url = "https://aliac-ai-moderation-backend.wetooa.me/predict-toxicity"

# The data to be passed in the POST request
data = {"text": "Bitch fuck you"}


# Function to send a request
def send_request():
    try:
        response = requests.post(url, json=data)
        print(
            f"Response Code: {response.status_code}, Response Length: {len(response.text)}"
        )
    except Exception as e:
        print(f"Request failed: {e}")


# Function to run multiple requests in parallel
def load_test(num_requests):
    start_time = time.time()
    with concurrent.futures.ThreadPoolExecutor() as executor:
        # Run num_requests in parallel
        futures = [executor.submit(send_request) for _ in range(num_requests)]
        # Wait for all futures to complete
        concurrent.futures.wait(futures)

    end_time = time.time()
    print(f"Completed {num_requests} requests in {end_time - start_time:.2f} seconds.")


# Number of requests you want to send (adjust as needed)
num_requests = 100

# Start the load test
load_test(num_requests)
