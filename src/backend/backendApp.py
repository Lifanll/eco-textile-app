from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel
import torch
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForImageClassification
from fastapi import FastAPI, HTTPException
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import sqlite3
import os

# init ai
openai_api_key = "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"
client = OpenAI(
    api_key = openai_api_key,  # This is the default and can be omitted
)

# connect to database
database = sqlite3.connect('my_database.db')
cursor = database.cursor()

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Define label mapping
labels = {v: k for k, v in {'canvas': 0, 'chambray': 1, 'chenille': 2, 'chiffon': 3, 'corduroy': 4, 'crepe': 5, 'denim': 6, 'faux_fur': 7, 'faux_leather': 8, 'flannel': 9, 'fleece': 10, 'gingham': 11, 'jersey': 12, 'knit': 13, 'lace': 14, 'lawn': 15, 'neoprene': 16, 'organza': 17, 'plush': 18, 'satin': 19, 'serge': 20, 'taffeta': 21, 'tulle': 22, 'tweed': 23, 'twill': 24, 'velvet': 25, 'vinyl': 26}.items()}

# Load the ViT model
model_path = "/Users/lifanlin/final year project/eco-textile-app/model/TextileNet-fabric/vits_ckpt.pth"
num_classes = 27  # Adjust based on your use case

# Use a pre-trained ViT model as the base
processor = AutoImageProcessor.from_pretrained("google/vit-base-patch16-224")
model = AutoModelForImageClassification.from_pretrained(
    "google/vit-base-patch16-224",
    num_labels=num_classes,
    ignore_mismatched_sizes=True  # To adapt the model for your dataset
)

# Load the checkpoint weights
checkpoint = torch.load(model_path, map_location=torch.device('cpu'))
state_dict = checkpoint["model"] if "model" in checkpoint else checkpoint["state_dict"]
model.load_state_dict(state_dict, strict=False)

# Set the model to evaluation mode
model.eval()
print("Vision Transformer model loaded successfully!")

@app.post("/predict")
async def predict(image: UploadFile = File(...)):
    """
    Predict the class of the uploaded image.
    """
    try:
        # Ensure the uploaded file is an image
        if not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")

        # Open and preprocess the image
        img = Image.open(image.file).convert("RGB")
        inputs = processor(images=img, return_tensors="pt")

        # Perform prediction
        with torch.no_grad():
            outputs = model(**inputs)
            predicted_class = torch.argmax(outputs.logits, dim=-1).item()

        # Return the prediction
        return {"prediction": labels[predicted_class]}

    except Exception as e:
        print(f"Error during prediction: {str(e)}")  # Log the error
        raise HTTPException(status_code=500, detail=str(e))
    
class SignUpRequest(BaseModel):
    username: str
    password: str

@app.post("/signup")
async def signup(request: SignUpRequest):
    try:
        # Check if the username already exists
        cursor.execute("SELECT COUNT(*) FROM user WHERE username = ?", (request.username,))
        if cursor.fetchone()[0] > 0:
            raise HTTPException(status_code=400, detail="Username already exists")
        
        # Insert new user securely with parameterized queries
        cursor.execute("INSERT INTO user (username, password) VALUES (?, ?)", (request.username, request.password))
        database.commit()

        # Retrieve the newly inserted user ID
        cursor.execute("SELECT id FROM user WHERE username = ?", (request.username,))
        user_id = cursor.fetchone()[0]

        return {"successful": True, "response": "Successfully signed up", "userID": user_id}
    
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Unexpected server error")
    
class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/login")
async def login(request: LoginRequest):
    try:
        # Fetch the password for the given username securely using parameterized query
        cursor.execute("SELECT id, password FROM user WHERE username = ?", (request.username,))
        user = cursor.fetchone()

        # Check if user exists and the password matches
        if not user or request.password != user[1]:
            raise HTTPException(status_code=400, detail="Wrong username or password")

        # Retrieve user ID and respond
        user_id = user[0]
        return {"successful": True, "response": "Successfully logged in", "userID": user_id}

    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Unexpected server error")

class CreateConversationRequest(BaseModel):
    userID: str
    title: str

@app.post("/createConversation")
async def create_conversation(request: CreateConversationRequest):
    try:
        # Check if the conversation already exists for current user
        cursor.execute("SELECT COUNT(*) FROM conversation WHERE userId = ? AND title = ?", (request.userID, request.title))
        if cursor.fetchone()[0] > 0:
            raise HTTPException(status_code=400, detail="Duplicated conversation title")
        
        # Insert new conversation securely with parameterized queries
        cursor.execute("INSERT INTO conversation (userId, titile) VALUES (?, ?)", (request.userID, request.title))
        database.commit()

        # Retrieve the newly inserted conversation ID
        cursor.execute("SELECT id FROM conversation WHERE userID = ? AND title = ?", (request.userID, request.title))
        conversation_id = cursor.fetchone()[0]

        return {"successful": True, "response": "Successfully create conversation", "conversationId": conversation_id}
    
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Unexpected server error")

class DeleteConversationRequest(BaseModel):
    userID: str
    conversationID: str

@app.post("/deleteConversation")
async def delete_conversation(request: DeleteConversationRequest):
    try:
        # Check if the conversation exists and belongs to the user
        cursor.execute("SELECT COUNT(*) FROM conversation WHERE id = ? AND userId = ?", (request.conversationID, request.userID))
        if cursor.fetchone()[0] == 0:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Delete conversation securely
        cursor.execute("DELETE FROM conversation WHERE id = ? AND userId = ?", (request.conversationID, request.userID))
        database.commit()

        return {"successful": True, "response": "Successfully deleted conversation"}
    
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Unexpected server error")

# Define the request body using Pydantic
class AskRequest(BaseModel):
    query: str
    conversationID: str

@app.post("/ask")
async def ask_question(request: AskRequest):
    """
    Response to user question
    """
    try:
        # Pass context to LLM for generation
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": request.query,
                }
            ],
            model="gpt-4o-mini",
        )
        generated_text = chat_completion.choices[0].message.content
        return {"response": generated_text}
    except Exception as e:
        print(str(e))
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

# Run using `uvicorn`:
# uvicorn src.backend.backendApp:app --host 127.0.0.1 --port 8000 --reload
