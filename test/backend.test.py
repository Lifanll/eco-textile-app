import requests

def test_get_messages():
    res = requests.post("https://eco-textile-app-backend.onrender.com/getMessages", json={
        "conversationID": 1
    }, headers={"Authorization": "Bearer test-token"})

    assert res.status_code == 200
    assert "messages" in res.json()

def test_ask():
    res = requests.post("https://eco-textile-app-backend.onrender.com/ask", json={
        "query": "What is cotton?",
        "conversationID": 1,
        "textile": "",
        "imagePath": ""
    }, headers={"Authorization": "Bearer test-token"})

    assert res.status_code == 200
    assert "response" in res.json()
