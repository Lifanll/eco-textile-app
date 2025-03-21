import datetime
from fastapi import Body, Depends, FastAPI, File, Security, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
import jwt
from openai import OpenAI
from pydantic import BaseModel
from PIL import Image
import torch
from transformers import AutoImageProcessor, AutoModelForImageClassification
from torchvision import models
from fastapi import FastAPI, HTTPException
from passlib.context import CryptContext
import sqlite3
from uuid import uuid4
from sentence_transformers import SentenceTransformer
import os
from fastapi.staticfiles import StaticFiles
import base64
from starlette.requests import Request

# init ai
GPT_MODEL = "gpt-4o"
EMBEDDING_MODEL = "text-embedding-3-small"
client = OpenAI(
    api_key=os.environ["API_KEY"],
)

SECRET_KEY = os.environ["SECRET_KEY"]
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1 hour token expiry

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 for authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# prevents tokenizers from running in parallel and causing deadlocks
os.environ["TOKENIZERS_PARALLELISM"] = "false"

# connect to database
database = sqlite3.connect('my_database.db', check_same_thread=False)
cursor = database.cursor()

embedder = SentenceTransformer('all-MiniLM-L6-v2')

# Preprocess knowledge base embeddings
# documents = ["knowledge/"+k+".txt" for k,v in {'abaca': 0, 'acrylic': 1, 'alpaca': 2, 'angora': 3, 'aramid': 4, 'camel': 5, 'cashmere': 6, 'cotton': 7, 'cupro': 8, 'elastane_spandex': 9, 'flax_linen': 10, 'fur': 11, 'hemp': 12, 'horse_hair': 13, 'jute': 14, 'leather': 15, 'llama': 16, 'lyocell': 17, 'milk_fiber': 18, 'modal': 19, 'mohair': 20, 'nylon': 21, 'polyester': 22, 'polyolefin': 23, 'ramie': 24, 'silk': 25, 'sisal': 26, 'soybean_fiber': 27, 'suede': 28, 'triacetate_acetate': 29, 'viscose_rayon': 30, 'wool': 31, 'yak': 32}.items()]
# index = {'abaca': 0, 'acrylic': 1, 'alpaca': 2, 'angora': 3, 'aramid': 4, 'camel': 5, 'cashmere': 6, 'cotton': 7, 'cupro': 8, 'elastane_spandex': 9, 'flax_linen': 10, 'fur': 11, 'hemp': 12, 'horse_hair': 13, 'jute': 14, 'leather': 15, 'llama': 16, 'lyocell': 17, 'milk_fiber': 18, 'modal': 19, 'mohair': 20, 'nylon': 21, 'polyester': 22, 'polyolefin': 23, 'ramie': 24, 'silk': 25, 'sisal': 26, 'soybean_fiber': 27, 'suede': 28, 'triacetate_acetate': 29, 'viscose_rayon': 30, 'wool': 31, 'yak': 32}
# knowledge_base = []
# for document in documents:
#     f = open(document, "r")
#     knowledge_base.append(f.read())
#     f.close()

# Generate embeddings for knowledge base
# kb_embeddings = embedder.encode(knowledge_base)

# # Build FAISS index
# index = faiss.IndexFlatL2(kb_embeddings.shape[1])
# index.add(np.array(kb_embeddings))

# Initialize FastAPI app
app = FastAPI()

# Ensure the 'images' directory exists
os.makedirs("images", exist_ok=True)

# Mount the 'images' directory so it can be served as static files
app.mount("/images", StaticFiles(directory="images"), name="images")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Define label mapping
labels = {v: k for k, v in {'abaca': 0, 'acrylic': 1, 'alpaca': 2, 'angora': 3, 'aramid': 4, 'camel': 5, 'cashmere': 6, 'cotton': 7, 'cupro': 8, 'elastane_spandex': 9, 'flax_linen': 10, 'fur': 11, 'hemp': 12, 'horse_hair': 13, 'jute': 14, 'leather': 15, 'llama': 16,
                            'lyocell': 17, 'milk_fiber': 18, 'modal': 19, 'mohair': 20, 'nylon': 21, 'polyester': 22, 'polyolefin': 23, 'ramie': 24, 'silk': 25, 'sisal': 26, 'soybean_fiber': 27, 'suede': 28, 'triacetate_acetate': 29, 'viscose_rayon': 30, 'wool': 31, 'yak': 32}.items()}


# Paths to the saved model checkpoints
model1_path = "model/TextileNet-fibre/vits_ckpt.pth"
model2_path = "model/TextileNet-fibre/res18_ckpt.pth"
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
            logits_resnet = model2(inputs['pixel_values'].squeeze(
                0).unsqueeze(0))  # ResNet expects [B, C, H, W]

            # Apply softmax to get probabilities
            probs_vit = torch.nn.functional.softmax(logits_vit, dim=-1)
            probs_resnet = torch.nn.functional.softmax(logits_resnet, dim=-1)

            # Get top-5 predictions from each model
            top5_probs_vit, top5_indices_vit = torch.topk(
                probs_vit, k=5, dim=-1)
            top5_probs_resnet, top5_indices_resnet = torch.topk(
                probs_resnet, k=5, dim=-1)

            # Combine predictions from both models
            combined_probs = {}

            # Add ViT top-5 results
            for idx, prob in zip(top5_indices_vit[0], top5_probs_vit[0]):
                label = labels[idx.item()]
                combined_probs[label] = combined_probs.get(
                    label, 0) + prob.item()

            # Add ResNet top-5 results
            for idx, prob in zip(top5_indices_resnet[0], top5_probs_resnet[0]):
                label = labels[idx.item()]
                combined_probs[label] = combined_probs.get(
                    label, 0) + prob.item()

            # Get the label with the highest combined probability
            best_label = max(combined_probs, key=combined_probs.get)

        return {"prediction": best_label, "image_path": image_path}

    except Exception as e:
        print(f"Error during prediction: {str(e)}")  # Log the error
        raise HTTPException(status_code=500, detail=str(e))

# ------------------------
# Credentials
# ------------------------

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: datetime.timedelta = None):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + (expires_delta or datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Security(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("user_id")

        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        return user_id

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

class SignUpRequest(BaseModel):
    username: str
    password: str


@app.post("/signup")
async def signup(request: SignUpRequest = Body(...)):
    try:
        # Check if the username already exists
        cursor.execute(
            "SELECT COUNT(*) FROM user WHERE username = ?", (request.username,))
        if cursor.fetchone()[0] > 0:
            raise HTTPException(
                status_code=400, detail="Username already exists")
        
        hashed_password = get_password_hash(request.password)

        # Insert new user securely with parameterized queries
        cursor.execute("INSERT INTO user (username, password) VALUES (?, ?)",
                       (request.username, hashed_password))
        database.commit()

        # Retrieve the newly inserted user ID
        cursor.execute("SELECT id FROM user WHERE username = ?",
                       (request.username,))
        user_id = cursor.fetchone()[0]

        access_token = create_access_token({"user_id": user_id})

        return {"access_token": access_token, "token_type": "bearer"}

    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Unexpected server error")


class LoginRequest(BaseModel):
    username: str
    password: str


@app.post("/login")
async def login(request: LoginRequest = Body(...)):
    try:
        # Fetch the password for the given username securely using parameterized query
        cursor.execute(
            "SELECT id, password FROM user WHERE username = ?", (request.username,))
        user = cursor.fetchone()

        if not user:
            raise HTTPException(status_code=400, detail="Wrong username or password")

        if not verify_password(request.password, user[1]):
            raise HTTPException(status_code=400, detail="Wrong username or password")


        # Retrieve user ID, user conversations and respond
        user_id = user[0]
        access_token = create_access_token({"user_id": user_id})
        return {"access_token": access_token, "token_type": "bearer"}

    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Unexpected server error")


# -----------------------------
# User Conversations Management
# -----------------------------

class CreateConversationRequest(BaseModel):
    title: str


@app.post("/createConversation")
async def create_conversation(request: CreateConversationRequest = Body(...), user_id: int = Depends(get_current_user)):
    try:
        # Check if the conversation already exists for current user
        cursor.execute("SELECT COUNT(*) FROM conversation WHERE userId = ? AND title = ?",
                       (user_id, request.title))
        if cursor.fetchone()[0] > 0:
            raise HTTPException(
                status_code=400, detail="Duplicated conversation title")

        # Insert new conversation securely with parameterized queries
        cursor.execute("INSERT INTO conversation (userId, title) VALUES (?, ?)",
                       (user_id, request.title))
        database.commit()

        # Retrieve the newly inserted conversation ID
        cursor.execute("SELECT id FROM conversation WHERE userID = ? AND title = ?",
                       (user_id, request.title))
        conversation_id = cursor.fetchone()[0]

        return {"conversationID": conversation_id}

    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Unexpected server error")


@app.post("/getConversations")
async def get_conversations(user_id: int = Depends(get_current_user)):
    try:
        # Retrieve conversations for the given userID
        cursor.execute(
            "SELECT id, title FROM conversation WHERE userId = ?", (user_id,))
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
    conversationID: str


@app.post("/deleteConversation")
async def delete_conversation(request: DeleteConversationRequest = Body(...), user_id: int = Depends(get_current_user)):
    try:
        # Check if the conversation exists and belongs to the user
        cursor.execute("SELECT COUNT(*) FROM conversation WHERE id = ? AND userId = ?",
                       (request.conversationID, user_id))
        if cursor.fetchone()[0] == 0:
            raise HTTPException(
                status_code=404, detail="Conversation not found")

        # Delete conversation securely
        cursor.execute("DELETE FROM conversation WHERE id = ? AND userId = ?",
                       (request.conversationID, user_id))
        database.commit()

        return {}

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
async def ask_question(request: AskRequest = Body(...), user_id: int = Depends(get_current_user)):
    try:
        # Check if user eligible to use the conversation
        cursor.execute("""
            SELECT userId
            FROM conversation
            WHERE id = ?
        """, (request.conversationID,))
        if (user_id != cursor.fetchone()[0]):
            raise HTTPException(status_code=403, detail="No access to this conversation")

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

        # Save the user's message (and image path) into the database
        cursor.execute("""
            INSERT INTO message (conversationId, isUser, imagePath, message) 
            VALUES (?, ?, ?, ?)
        """, (request.conversationID, True, request.imagePath, request.query))
        database.commit()

        # Todo: add multi-agent for style

        style_agent_query = f"""
        You are an expert on fashion design.
        If image uploaded, identify if they're clothing. If not, give simple answers to say that you don't think it's clothes.
        Otherwise, give a type for this in terms of style, along with some suggestions for outfit.
        Respond specifically to the user's query without unnecessary details and try to make it interactive like a conversation.
        Here is the user's query: {request.query}
        """

        # If an image is uploaded, include it in the request to OpenAI
        if request.imagePath:
            with open(request.imagePath, "rb") as image_file:
                data_url = base64.b64encode(image_file.read()).decode("utf-8")
            style_agent_inputs = messages
            style_agent_inputs.append({
                "role": "user",
                "content": [
                    {"type": "text", "text": style_agent_query},
                    {"type": "image_url", "image_url": {
                        "url": f"data:image/jpeg;base64,{data_url}"}}
                ]
            })
        else:
            style_agent_inputs = messages
            style_agent_inputs.append({"role": "user", "content": style_agent_query})

        style_agent_chat_complete = client.chat.completions.create(
            temperature= 0.7,
            messages=style_agent_inputs,
            model=GPT_MODEL,
        )

        style_agent_response = style_agent_chat_complete.choices[0].message.content

        print("\n\n\n" + style_agent_response + "\n\n\n")

        # Todo: add another agent focus on textile sustainablity

        sustain_agent_query = f"""
        If image uploaded, identify if it's a textile made staff, if not, say you don't think it's a textile. otherwise use the identified textile. The identified textile from the image is {request.textile}.
        Respond specifically to the user's query without unnecessary details and try to make it interactive like a conversation.
        Focus on providing practical suggestions that directly address the user's request.
        Only include eco-friendly options, alternatives, laundering methods, recycling, upcycling, or disposal practices if they are relevant to the user's question.
        Give a score in sustainability out of 5 if a certain textile is asked for the first time, consider Resource Consumption, Emissions, Waste Generation and Chemical Usage. Explain the details only if users want to know more about what this score is given.
        Here is the user's query: {request.query}
        """

        # If an image is uploaded, include it in the request to OpenAI
        if request.imagePath:
            sustain_agent_inputs = messages
            sustain_agent_inputs.append({
                "role": "user",
                "content": [
                    {"type": "text", "text": sustain_agent_query},
                    {"type": "image_url", "image_url": {
                        "url": f"data:image/jpeg;base64,{data_url}"}}
                ]
            })
        else:
            sustain_agent_inputs = messages
            sustain_agent_inputs.append({"role": "user", "content": sustain_agent_query})

        sustain_agent_chat_complete = client.chat.completions.create(
            temperature= 0.4,
            messages=messages,
            model=GPT_MODEL,
        )

        sustain_agent_response = sustain_agent_chat_complete.choices[0].message.content

        # recycling agent

        recycle_agent_query = f"""
        You are a Recycling Expert specializing in textile waste reduction.  
        Provide clear and actionable guidance on how users can **recycle or upcycle fabrics**.  
        If recycling options are unavailable, suggest **eco-friendly disposal alternatives**.
        Here is the user's query: {request.query}
        """     

        # If an image is uploaded, include it in the request to OpenAI
        if request.imagePath:
            recycle_agent_inputs = messages
            recycle_agent_inputs.append({
                "role": "user",
                "content": [
                    {"type": "text", "text": recycle_agent_query},
                    {"type": "image_url", "image_url": {
                        "url": f"data:image/jpeg;base64,{data_url}"}}
                ]
            })
        else:
            recycle_agent_inputs = messages
            recycle_agent_inputs.append({"role": "user", "content": recycle_agent_query})

        recycle_agent_chat_complete = client.chat.completions.create(
            temperature= 0.4,
            messages=messages,
            model=GPT_MODEL,
        )

        recycle_agent_response = recycle_agent_chat_complete.choices[0].message.content

        print("\n\n\n" + recycle_agent_response + "\n\n\n")

        # Todo: final agent combine the results from other agents

        final_agent_query = f"""
        Your job is to conclude content from other three agents.
        Focus on user query and give conversational response, you don't need to include all the information from other agents.
        Here are the response from the other three agent:
        Style agent:
        {style_agent_response}.

        Sustainablitity agent:
        {sustain_agent_response}.

        Recycle agent:
        {recycle_agent_response}

        Decide what to including and the propotion by the user's query:
        {request.query}
        """

        # If an image is uploaded, include it in the request to OpenAI
        if request.imagePath:
            messages.append({
                "role": "user",
                "content": [
                    {"type": "text", "text": final_agent_query},
                    {"type": "image_url", "image_url": {
                        "url": f"data:image/jpeg;base64,{data_url}"}}
                ]
            })
        else:
            messages.append({"role": "user", "content": final_agent_query})

        # modified_query = (
        #     f"If imaged uploaded, identify if it's a textile made staff, if not, say you don't think it's a textile. otherwise use the identified textile. The identified textile from the image is {request.textile}."
        #     f"Respond specifically to the user's query without unnecessary details and try to make it interactive like a conversation. "
        #     f"Focus on providing practical suggestions that directly address the user's request. "
        #     f"Only include eco-friendly options, alternatives, laundering methods, recycling, upcycling, or disposal practices if they are relevant to the user's question. "
        #     f"Give a score in sustainability out of 5 if a certain textile is asked for the first time, consider Resource Consumption, Emissions, Waste Generation and Chemical Usage. Explain the details only if users want to know more about what this score is given."
        #     f"Here is the user's query: {request.query}"
        # )


        # Get response from the LLM
        chat_completion = client.chat.completions.create(
            temperature=0.1,
            messages=messages,
            model=GPT_MODEL,
        )
        generated_text = chat_completion.choices[0].message.content

        # Save the LLM's response into the database
        cursor.execute("""
            INSERT INTO message (conversationId, isUser, imagePath, message) 
            VALUES (?, ?, ?, ?)
        """, (request.conversationID, False, None, generated_text))
        database.commit()

        return {"response": generated_text}

    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Unexpected error: {str(e)}")
    
class GetMessagesRequest(BaseModel):
    conversationID: int


@app.post("/getMessages")
async def get_messages(request: GetMessagesRequest = Body(...), user_id: int = Depends(get_current_user)):
    try:
        # Check if user eligible to get message
        cursor.execute("""
            SELECT userId
            FROM conversation
            WHERE id = ?
        """, (request.conversationID,))
        if (user_id != cursor.fetchone()[0]):
            raise HTTPException(status_code=403, detail="No access to this conversation")
        
        # Get messages
        cursor.execute("""
            SELECT message, isUser, imagePath, timestamp
            FROM message
            WHERE conversationId = ?
            ORDER BY timestamp ASC
        """, (request.conversationID,))
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
    
# ---------------------
# Debug Logs
# ---------------------

@app.middleware("http")
async def log_body(request: Request, call_next):
    body = await request.body()
    print("🔍 RAW REQUEST BODY:", body.decode())
    return await call_next(request)

# Run using `uvicorn`:
# uvicorn src.backend.backendApp:app --host 127.0.0.1 --port 8000 --reload
