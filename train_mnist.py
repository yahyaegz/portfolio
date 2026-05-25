import numpy as np
import json
from sklearn.datasets import fetch_openml
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
import os

print("Fetching MNIST dataset (60,000 samples)...")
mnist = fetch_openml('mnist_784', version=1, parser='auto')
X, y = mnist.data.to_numpy(), mnist.target.to_numpy().astype(int)

# Use first 60,000 samples to train a highly robust model
X = X[:60000]
y = y[:60000]

# Normalise pixels to [0, 1]
X = X / 255.0

print(f"Training MLP Classifier (784 -> 64 -> 10) on {len(X)} samples...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.1, random_state=42)

# Train a highly robust 3-layer MLP classifier
# activation='logistic' (Sigmoid) matches JS forward pass perfectly
mlp = MLPClassifier(
    hidden_layer_sizes=(64,),
    activation='logistic',
    solver='adam',
    max_iter=100,
    random_state=42,
    verbose=True
)
mlp.fit(X_train, y_train)

# Check accuracy
train_acc = mlp.score(X_train, y_train)
test_acc = mlp.score(X_test, y_test)
print(f"Training Accuracy: {train_acc * 100:.2f}%")
print(f"Testing Accuracy: {test_acc * 100:.2f}%")

# Extract weights and biases, rounding to 6 decimal places to keep the JSON size small
model_data = {
    "w1": np.round(mlp.coefs_[0].T, 6).tolist(), # Transpose to shape (64, 784) for easy JS looping
    "b1": np.round(mlp.intercepts_[0], 6).tolist(), # Shape (64,)
    "w2": np.round(mlp.coefs_[1].T, 6).tolist(), # Transpose to shape (10, 64)
    "b2": np.round(mlp.intercepts_[1], 6).tolist() # Shape (10,)
}

# Write weights as JSON to be loaded in React
output_path = os.path.join(os.getcwd(), "src", "data", "mnist_weights.json")
os.makedirs(os.path.dirname(output_path), exist_ok=True)
with open(output_path, "w") as f:
    json.dump(model_data, f)

print(f"Weights successfully saved to {output_path}!")
print(f"Weights file size: {os.path.getsize(output_path) / 1024:.2f} KB")
