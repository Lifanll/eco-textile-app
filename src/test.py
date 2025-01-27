import faiss
import numpy as np

# Step 1: Generate Example Embeddings
# Assume you have 100 documents, each with 768-dimensional embeddings
num_docs = 100
embedding_dim = 768
embeddings = np.random.rand(num_docs, embedding_dim).astype('float32')

# Step 2: Create a FAISS Index
# Using a flat index with L2 (Euclidean) similarity
index = faiss.IndexFlatL2(embedding_dim)

# Add embeddings to the index
index.add(embeddings)
print(f"Added {index.ntotal} embeddings to the FAISS index.")

# Step 3: Save the Index to a File
faiss.write_index(index, "faiss/test_faiss.bin")
print("FAISS index saved to faiss_index.bin")
