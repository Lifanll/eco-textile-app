import requests

BASE_URL = "https://eco-textile-app-backend.onrender.com"  # Replace with your deployed backend URL

access_token = None  # Will be set after login


def test_signup():
    payload = {"username": "testuser_api1", "password": "testpass123"}
    res = requests.post(f"{BASE_URL}/signup", json=payload)
    assert res.status_code in [200, 400]  # 400 if already exists
    print("✅ Signup Test Passed")


def test_login():
    global access_token
    payload = {"username": "testuser_api", "password": "testpass123"}
    res = requests.post(f"{BASE_URL}/login", json=payload)
    assert res.status_code == 200
    access_token = res.json()["access_token"]
    assert access_token
    print("✅ Login Test Passed")


def test_create_conversation():
    headers = {"Authorization": f"Bearer {access_token}"}
    payload = {"title": "Test Conversation"}
    res = requests.post(f"{BASE_URL}/createConversation", headers=headers, json=payload)
    assert res.status_code in [200, 400]
    if res.status_code == 200:
        print("✅ Create Conversation Passed")
        return res.json()["conversationID"]
    else:
        print("ℹ️ Conversation already exists")
        return None


def test_get_conversations():
    headers = {"Authorization": f"Bearer {access_token}"}
    res = requests.post(f"{BASE_URL}/getConversations", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "conversations" in data
    print("✅ Get Conversations Passed")
    return data["conversations"]


def test_rename_conversation(conv_id):
    headers = {"Authorization": f"Bearer {access_token}"}
    payload = {"conversationID": conv_id, "newTitle": "Renamed Conversation"}
    res = requests.post(f"{BASE_URL}/renameConversation", headers=headers, json=payload)
    assert res.status_code == 200
    print("✅ Rename Conversation Passed")


def test_ask(conv_id):
    headers = {"Authorization": f"Bearer {access_token}"}
    payload = {
        "query": "What is the environmental impact of cotton?",
        "conversationID": conv_id,
        "textile": "cotton",
        "imagePath": ""
    }
    res = requests.post(f"{BASE_URL}/ask", headers=headers, json=payload)
    assert res.status_code == 200
    assert "response" in res.json()
    print("✅ Ask Question Passed")


def test_get_messages(conv_id):
    headers = {"Authorization": f"Bearer {access_token}"}
    payload = {"conversationID": conv_id}
    res = requests.post(f"{BASE_URL}/getMessages", headers=headers, json=payload)
    assert res.status_code == 200
    print("✅ Get Messages Passed")


def test_delete_conversation(conv_id):
    headers = {"Authorization": f"Bearer {access_token}"}
    payload = {"conversationID": conv_id}
    res = requests.post(f"{BASE_URL}/deleteConversation", headers=headers, json=payload)
    assert res.status_code == 200
    print("✅ Delete Conversation Passed")


# -------------------
# Run the test suite
# -------------------
test_signup()
test_login()
conv_id = test_create_conversation()
if not conv_id:
    convs = test_get_conversations()
    conv_id = convs[0]["id"] if convs else None
if conv_id:
    test_rename_conversation(conv_id)
    test_ask(conv_id)
    test_get_messages(conv_id)
    test_delete_conversation(conv_id)
