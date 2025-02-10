from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel
from PIL import Image
import torch
from transformers import AutoImageProcessor, AutoModelForImageClassification
from torchvision import models
from fastapi import FastAPI, HTTPException
import numpy as np
from typing import List
import sqlite3
from uuid import uuid4
import faiss
from sentence_transformers import SentenceTransformer
import os
from fastapi.staticfiles import StaticFiles

# init ai
openai_api_key = "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"
client = OpenAI(
    api_key=openai_api_key,  # This is the default and can be omitted
)

# connect to database
database = sqlite3.connect('my_database.db')
cursor = database.cursor()

embedder = SentenceTransformer('all-MiniLM-L6-v2')

# Preprocess knowledge base embeddings
knowledge_base = [
    "Organic cotton reduces water consumption compared to conventional cotton.",
    "Recycled polyester reduces carbon emissions significantly.",
    "Bamboo fabric is biodegradable and requires less water to grow.",
    "Wool is naturally antimicrobial and doesn't require frequent washing.",
    "Upcycling old denim reduces textile waste in landfills."
]

# Generate embeddings for knowledge base
kb_embeddings = embedder.encode(knowledge_base)

# Build FAISS index
index = faiss.IndexFlatL2(kb_embeddings.shape[1])
index.add(np.array(kb_embeddings))

# Initialize FastAPI app
app = FastAPI()

# Ensure the 'images' directory exists
os.makedirs("images", exist_ok=True)

# Mount the 'images' directory so it can be served as static files
app.mount("/images", StaticFiles(directory="images"), name="images")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Define label mapping
labels = {v: k for k, v in {'abaca': 0, 'acrylic': 1, 'alpaca': 2, 'angora': 3, 'aramid': 4, 'camel': 5, 'cashmere': 6, 'cotton': 7, 'cupro': 8, 'elastane_spandex': 9, 'flax_linen': 10, 'fur': 11, 'hemp': 12, 'horse_hair': 13, 'jute': 14, 'leather': 15, 'llama': 16, 'lyocell': 17, 'milk_fiber': 18, 'modal': 19, 'mohair': 20, 'nylon': 21, 'polyester': 22, 'polyolefin': 23, 'ramie': 24, 'silk': 25, 'sisal': 26, 'soybean_fiber': 27, 'suede': 28, 'triacetate_acetate': 29, 'viscose_rayon': 30, 'wool': 31, 'yak': 32}.items()}



# Paths to the saved model checkpoints
model1_path = "/Users/lifanlin/final year project/eco-textile-app/model/TextileNet-fibre/vits_ckpt.pth"
model2_path = "/Users/lifanlin/final year project/eco-textile-app/model/TextileNet-fibre/res18_ckpt.pth"
num_classes = 33  # Number of classes

# Initialize the processor (for ViT)
processor = AutoImageProcessor.from_pretrained("google/vit-base-patch16-224")

# ------------------------
# Model 1: Vision Transformer (ViT)
# ------------------------
model1 = AutoModelForImageClassification.from_pretrained(
    "google/vit-base-patch16-224",
    num_labels=num_classes,
    ignore_mismatched_sizes=True
)

# Load checkpoint for ViT
checkpoint1 = torch.load(model1_path, map_location=torch.device('cpu'))
state_dict1 = checkpoint1.get("model", checkpoint1.get("state_dict"))
model1.load_state_dict(state_dict1, strict=False)

# Set model to evaluation mode
model1.eval()
print("Vision Transformer model loaded successfully!")

# ------------------------
# Model 2: ResNet-18
# ------------------------
# Load ResNet-18 with the correct number of output classes
model2 = models.resnet18(pretrained=False)
model2.fc = torch.nn.Linear(model2.fc.in_features, num_classes)

# Load checkpoint for ResNet-18
checkpoint2 = torch.load(model2_path, map_location=torch.device('cpu'))
state_dict2 = checkpoint2.get("model", checkpoint2.get("state_dict"))
model2.load_state_dict(state_dict2, strict=False)

# Set model to evaluation mode
model2.eval()
print("ResNet-18 model loaded successfully!")


@app.post("/predict")
async def predict(image: UploadFile = File(...)):
    """
    Predict the class of the uploaded image.
    """
    try:
        # Ensure the uploaded file is an image
        if not image.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400, detail="Invalid file type. Please upload an image.")


        # Generate a unique filename for the image
        image_name = f"{uuid4().hex}_{image.filename}"
        image_path = os.path.join("images", image_name)

        # Save the image to the server
        with open(image_path, "wb") as f:
            while chunk := image.file.read(1024):  
                f.write(chunk)

        # Open and preprocess the image
        img = Image.open(image.file).convert("RGB")
        inputs = processor(images=img, return_tensors="pt")

        with torch.no_grad():
            # Get logits from both models
            logits_vit = model1(**inputs).logits
            logits_resnet = model2(inputs['pixel_values'].squeeze(0).unsqueeze(0))  # ResNet expects [B, C, H, W]

            # Apply softmax to get probabilities
            probs_vit = torch.nn.functional.softmax(logits_vit, dim=-1)
            probs_resnet = torch.nn.functional.softmax(logits_resnet, dim=-1)

            # Get top-5 predictions from each model
            top5_probs_vit, top5_indices_vit = torch.topk(probs_vit, k=5, dim=-1)
            top5_probs_resnet, top5_indices_resnet = torch.topk(probs_resnet, k=5, dim=-1)

            # Combine predictions from both models
            combined_probs = {}

            # Add ViT top-5 results
            for idx, prob in zip(top5_indices_vit[0], top5_probs_vit[0]):
                label = labels[idx.item()]
                combined_probs[label] = combined_probs.get(label, 0) + prob.item()

            # Add ResNet top-5 results
            for idx, prob in zip(top5_indices_resnet[0], top5_probs_resnet[0]):
                label = labels[idx.item()]
                combined_probs[label] = combined_probs.get(label, 0) + prob.item()

            # Get the label with the highest combined probability
            best_label = max(combined_probs, key=combined_probs.get)

        return {"prediction": best_label, "image_path": image_path}

    except Exception as e:
        print(f"Error during prediction: {str(e)}")  # Log the error
        raise HTTPException(status_code=500, detail=str(e))

# ------------------------
# Credentials
# ------------------------


class SignUpRequest(BaseModel):
    username: str
    password: str


@app.post("/signup")
async def signup(request: SignUpRequest):
    try:
        # Check if the username already exists
        cursor.execute(
            "SELECT COUNT(*) FROM user WHERE username = ?", (request.username,))
        if cursor.fetchone()[0] > 0:
            raise HTTPException(
                status_code=400, detail="Username already exists")

        # Insert new user securely with parameterized queries
        cursor.execute("INSERT INTO user (username, password) VALUES (?, ?)",
                       (request.username, request.password))
        database.commit()

        # Retrieve the newly inserted user ID
        cursor.execute("SELECT id FROM user WHERE username = ?",
                       (request.username,))
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
        cursor.execute(
            "SELECT id, password FROM user WHERE username = ?", (request.username,))
        user = cursor.fetchone()

        # Check if user exists and the password matches
        if not user or request.password != user[1]:
            raise HTTPException(
                status_code=400, detail="Wrong username or password")

        # Retrieve user ID, user conversations and respond
        user_id = user[0]
        cursor.execute(
            "SELECT id, title FROM conversation WHERE userId = ?", (user_id,))
        return {"successful": True, "response": "Successfully logged in", "userID": user_id}

    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Unexpected server error")


# -----------------------------
# User Conversations Management
# -----------------------------
class CreateConversationRequest(BaseModel):
    userID: str
    title: str


@app.post("/createConversation")
async def create_conversation(request: CreateConversationRequest):
    try:
        # Check if the conversation already exists for current user
        cursor.execute("SELECT COUNT(*) FROM conversation WHERE userId = ? AND title = ?",
                       (request.userID, request.title))
        if cursor.fetchone()[0] > 0:
            raise HTTPException(
                status_code=400, detail="Duplicated conversation title")

        # Insert new conversation securely with parameterized queries
        cursor.execute("INSERT INTO conversation (userId, title) VALUES (?, ?)",
                       (request.userID, request.title))
        database.commit()

        # Retrieve the newly inserted conversation ID
        cursor.execute("SELECT id FROM conversation WHERE userID = ? AND title = ?",
                       (request.userID, request.title))
        conversation_id = cursor.fetchone()[0]

        return {"successful": True, "response": "Successfully create conversation", "conversationId": conversation_id}

    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Unexpected server error")


class GetConversationsRequest(BaseModel):
    userID: str


@app.post("/getConversations")
async def get_conversations(request: GetConversationsRequest):
    try:
        # Retrieve conversations for the given userID
        cursor.execute(
            "SELECT id, title FROM conversation WHERE userId = ?", (request.userID,))
        conversations = cursor.fetchall()

        # Format the result into a list of dictionaries
        conversation_list = [{"id": row[0], "title": row[1]}
                             for row in conversations]

        return {"conversations": conversation_list}

    except Exception as e:
        print(f"Error fetching conversations: {e}")
        raise HTTPException(
            status_code=500, detail="Could not fetch conversations")


class DeleteConversationRequest(BaseModel):
    userID: str
    conversationID: str


@app.post("/deleteConversation")
async def delete_conversation(request: DeleteConversationRequest):
    try:
        # Check if the conversation exists and belongs to the user
        cursor.execute("SELECT COUNT(*) FROM conversation WHERE id = ? AND userId = ?",
                       (request.conversationID, request.userID))
        if cursor.fetchone()[0] == 0:
            raise HTTPException(
                status_code=404, detail="Conversation not found")

        # Delete conversation securely
        cursor.execute("DELETE FROM conversation WHERE id = ? AND userId = ?",
                       (request.conversationID, request.userID))
        database.commit()

        return {"successful": True, "response": "Successfully deleted conversation"}

    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Unexpected server error")

# ----------------------------------
# Conversation Messages Management
# ----------------------------------


class AskRequest(BaseModel):
    query: str
    conversationID: int
    textile: str = None
    imagePath: str = None


@app.post("/ask")
async def ask_question(request: AskRequest):
    try:
        # Fetch conversation history
        cursor.execute("""
            SELECT message, isUser FROM message
            WHERE conversationId = ?
            ORDER BY timestamp ASC
        """, (request.conversationID,))
        conversation_history = cursor.fetchall()

        # Prepare message history for OpenAI
        messages = [
            {"role": "user" if is_user else "assistant", "content": message}
            for message, is_user in conversation_history
        ]

        # Retrieve relevant knowledge from the knowledge base
        query_embedding = embedder.encode([request.query])
        D, I = index.search(query_embedding, k=3)  # Top-3 relevant facts

        # Combine retrieved knowledge
        retrieved_facts = "\n".join([knowledge_base[i] for i in I[0]])

        # Combine the user's query with the prediction result
        modified_query = (
            f"The identified textile from the image is {request.textile}. If it's empty, it means the user did not upload an image. "
            f"\nRelevant facts: {retrieved_facts}\n"
            f"Respond specifically to the user's query without unnecessary details and try to make it interactive like a conversation. "
            f"Focus on providing practical suggestions that directly address the user's request. "
            f"Only include eco-friendly options, alternatives, laundering methods, recycling, upcycling, or disposal practices if they are relevant to the user's question. "
            f"Here is the user's query: {request.query}"
        )

        # Add the new user message
        messages.append({"role": "user", "content": modified_query})

        # Save the user's message (and image path) into the database
        cursor.execute("""
            INSERT INTO message (conversationId, isUser, image, message) 
            VALUES (?, ?, ?, ?)
        """, (request.conversationID, True, request.imagePath, request.query))
        database.commit()

        # Get response from the LLM
        chat_completion = client.chat.completions.create(
            messages=messages,
            model="gpt-4o-mini",
        )
        generated_text = chat_completion.choices[0].message.content

        # Save the LLM's response into the database
        cursor.execute("""
            INSERT INTO message (conversationId, isUser, image, message) 
            VALUES (?, ?, ?, ?)
        """, (request.conversationID, False, None, generated_text))
        database.commit()

        return {"response": generated_text}

    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Unexpected error: {str(e)}")


class GetMessagesRequest(BaseModel):
    conversationId: int

@app.post("/getMessages")
async def get_messages(request: GetMessagesRequest):
    try:
        cursor.execute("""
            SELECT message, isUser, image, timestamp
            FROM message
            WHERE conversationId = ?
            ORDER BY timestamp ASC
        """, (request.conversationId,))
        messages = cursor.fetchall()

        return {
            "messages": [
                {
                    "message": row[0],
                    "isUser": row[1],
                    "image": row[2],
                    "timestamp": row[3]
                }
                for row in messages
            ]
        }

    except Exception as e:
        print(f"Error fetching messages: {e}")
        raise HTTPException(status_code=500, detail="Error fetching messages")

# Run using `uvicorn`:
# uvicorn src.backend.backendApp:app --host 127.0.0.1 --port 8000 --reload
