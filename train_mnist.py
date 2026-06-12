import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
import json
import os

print("Fetching MNIST dataset...")
transform = transforms.Compose([
    transforms.ToTensor(),
])

train_dataset = datasets.MNIST('./data', train=True, download=True, transform=transform)
test_dataset = datasets.MNIST('./data', train=False, transform=transform)

train_loader = torch.utils.data.DataLoader(train_dataset, batch_size=128, shuffle=True)
test_loader = torch.utils.data.DataLoader(test_dataset, batch_size=1000, shuffle=False)

class MLP(nn.Module):
    def __init__(self):
        super(MLP, self).__init__()
        self.fc1 = nn.Linear(784, 256)
        self.fc2 = nn.Linear(256, 128)
        self.fc3 = nn.Linear(128, 10)
        
    def forward(self, x):
        x = x.view(-1, 784)
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        x = self.fc3(x)
        return x

def train():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    model = MLP().to(device)
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    criterion = nn.CrossEntropyLoss()

    epochs = 15
    print(f"Training deep MLP (784 -> 256 -> 128 -> 10) on {device} for {epochs} epochs...")

    for epoch in range(epochs):
        model.train()
        total_loss = 0
        correct = 0
        for batch_idx, (data, target) in enumerate(train_loader):
            data, target = data.to(device), target.to(device)
            optimizer.zero_grad()
            output = model(data)
            loss = criterion(output, target)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
            pred = output.argmax(dim=1, keepdim=True)
            correct += pred.eq(target.view_as(pred)).sum().item()
        
        acc = 100. * correct / len(train_loader.dataset)
        print(f"Epoch {epoch+1}/{epochs} - Loss: {total_loss/len(train_loader):.4f} - Train Acc: {acc:.2f}%")

    model.eval()
    correct = 0
    with torch.no_grad():
        for data, target in test_loader:
            data, target = data.to(device), target.to(device)
            output = model(data)
            pred = output.argmax(dim=1, keepdim=True)
            correct += pred.eq(target.view_as(pred)).sum().item()

    test_acc = 100. * correct / len(test_loader.dataset)
    print(f"\nTesting Accuracy: {test_acc:.2f}%\n")

    # Extract weights and biases
    model_data = {
        "architecture": "relu",
        "layers": [],
    }

    layers = [model.fc1, model.fc2, model.fc3]
    for idx, layer in enumerate(layers):
        w = layer.weight.detach().cpu().numpy()
        b = layer.bias.detach().cpu().numpy()
        
        model_data["layers"].append({
            "w": w.round(5).tolist(),
            "b": b.round(5).tolist(),
        })
        print(f"  Layer {idx+1}: w={w.shape}, b={b.shape}")

    output_path = os.path.join(os.getcwd(), "src", "data", "mnist_weights.json")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(model_data, f, separators=(',', ':'))

    size_kb = os.path.getsize(output_path) / 1024
    print(f"\nWeights successfully saved to {output_path}")
    print(f"Weights file size: {size_kb:.2f} KB")

if __name__ == "__main__":
    train()
