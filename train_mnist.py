import numpy as np
import json
from sklearn.datasets import fetch_openml
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
import os

print("Fetching MNIST dataset (70,000 samples)...")
mnist = fetch_openml('mnist_784', version=1, parser='auto')
X, y = mnist.data.to_numpy(), mnist.target.to_numpy().astype(int)

print(f"Total original samples: {len(X)}")

# Normalise pixels to [0, 1]
X = X / 255.0

print("Augmenting data (random shifts to improve robustness)...")
import scipy.ndimage
np.random.seed(42)

X_aug = []
y_aug = []

for img, label in zip(X, y):
    # Keep original
    X_aug.append(img)
    y_aug.append(label)
    
    # Add one shifted version (up to +/- 2 pixels in x and y)
    dy, dx = np.random.randint(-2, 3, size=2)
    if dy != 0 or dx != 0:
        shifted = scipy.ndimage.shift(img.reshape(28, 28), [dy, dx], cval=0, mode="constant").flatten()
        X_aug.append(shifted)
        y_aug.append(label)

X_aug = np.array(X_aug)
y_aug = np.array(y_aug)

print(f"Total samples after augmentation: {len(X_aug)}")

print(f"Training deep MLP (784 -> 256 -> 128 -> 10) on {len(X_aug)} samples with ReLU + Adam...")
X_train, X_test, y_train, y_test = train_test_split(X_aug, y_aug, test_size=0.1, random_state=42)

# Train a highly accurate deep MLP classifier using ReLU activations
# ReLU converges much faster and achieves higher accuracy than sigmoid
mlp = MLPClassifier(
    hidden_layer_sizes=(256, 128),
    activation='relu',
    solver='adam',
    learning_rate_init=0.001,
    max_iter=50,
    batch_size=128,
    random_state=42,
    verbose=True,
    early_stopping=True,
    validation_fraction=0.1,
    n_iter_no_change=10,
    tol=1e-5,
)
mlp.fit(X_train, y_train)

# Check accuracy
train_acc = mlp.score(X_train, y_train)
test_acc = mlp.score(X_test, y_test)
print(f"\nTraining Accuracy: {train_acc * 100:.2f}%")
print(f"Testing Accuracy:  {test_acc * 100:.2f}%")

# Extract weights and biases (3 layers: input->h1, h1->h2, h2->output)
# coefs_[i] shape: (n_features_in, n_features_out)
# We transpose to (n_features_out, n_features_in) for easy JS row-major looping
model_data = {
    "architecture": "relu",
    "layers": [],
}

for idx, (coef, intercept) in enumerate(zip(mlp.coefs_, mlp.intercepts_)):
    model_data["layers"].append({
        "w": np.round(coef.T, 5).tolist(),
        "b": np.round(intercept, 5).tolist(),
    })
    print(f"  Layer {idx+1}: w={coef.T.shape}, b={intercept.shape}")

# Write weights as JSON to be loaded in React
output_path = os.path.join(os.getcwd(), "src", "data", "mnist_weights.json")
os.makedirs(os.path.dirname(output_path), exist_ok=True)
with open(output_path, "w") as f:
    json.dump(model_data, f, separators=(',', ':'))

size_kb = os.path.getsize(output_path) / 1024
print(f"\nWeights successfully saved to {output_path}")
print(f"Weights file size: {size_kb:.2f} KB")
print(f"Model architecture: 784 -> 256 -> 128 -> 10 (ReLU hidden, softmax output)")
