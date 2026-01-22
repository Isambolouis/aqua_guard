import requests

url = "http://localhost:3000/api/data"

data = {
    "api_key": "AquaGuard_Secret_Key_2026",
    "flow_up": 18.5,
    "flow_down": 10.5
}

requests.post(url, json=data)
