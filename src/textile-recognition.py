from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
import torch
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForImageClassification  # Hugging Face

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/predict": {"origins": "http://localhost:3000"}})  # Allow requests from your React frontend

# Define label mapping
labels = {v: k for k, v in {'canvas': 0, 'chambray': 1, 'chenille': 2, 'chiffon': 3, 'corduroy': 4, 'crepe': 5, 'denim': 6, 'faux_fur': 7, 'faux_leather': 8, 'flannel': 9, 'fleece': 10, 'gingham': 11, 'jersey': 12, 'knit': 13, 'lace': 14, 'lawn': 15, 'neoprene': 16, 'organza': 17, 'plush': 18, 'satin': 19, 'serge': 20, 'taffeta': 21, 'tulle': 22, 'tweed': 23, 'twill': 24, 'velvet': 25, 'vinyl': 26}.items()}

# Load the ViT model
model_path = "/Users/lifanlin/Documents/ucl coursework/final year project/eco-textile-app/model/TextileNet-fabric/vits_ckpt.pth"
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

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get the image file from the request
        image_file = request.files.get('image')
        if not image_file:
            raise ValueError("No image file provided.")

        # Open and preprocess the image
        image = Image.open(image_file).convert("RGB")
        inputs = processor(images=image, return_tensors="pt")

        # Perform prediction
        with torch.no_grad():
            outputs = model(**inputs)
            predicted_class = torch.argmax(outputs.logits, dim=-1).item()

        # Return the prediction
        return jsonify({'prediction': labels[predicted_class]})
    except Exception as e:
        print(f"Error during prediction: {str(e)}")  # Log the error to the terminal
        return jsonify({'error': str(e)}), 500

# Run the app
if __name__ == '__main__':
    app.run(debug=True)
