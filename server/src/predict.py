import os
import sys
import json
import numpy as np
from PIL import Image
import tensorflow as tf

try:
    from tflite_runtime.interpreter import Interpreter
except ImportError:
    from tensorflow.lite.python.interpreter import Interpreter


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "tomato_disease_model.tflite"
)

LABEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "labels.json"
)
print("MODEL:", MODEL_PATH, file=sys.stderr)
print("LABEL:", LABEL_PATH, file=sys.stderr)
print(os.path.exists(MODEL_PATH), file=sys.stderr)

with open(LABEL_PATH, "r") as f:
    LABELS = json.load(f)


def health_score(label):

    scores = {
        "healthy": 100,
        "Early_blight": 70,
        "Late_blight": 30,
        "Leaf_Mold": 65,
        "Bacterial_spot": 60,
        "Septoria_leaf_spot": 55,
        "Spider_mites Two-spotted_spider_mite": 60,
        "Target_Spot": 55,
        "Tomato_Yellow_Leaf_Curl_Virus": 25,
        "Tomato_mosaic_virus": 20,
        "powdery_mildew": 65,
    }

    return scores.get(label, 50)


def preprocess(image_path):
    image = Image.open(image_path).convert("RGB")
    image = image.resize((224, 224))

    image = np.array(image, dtype=np.float32)

    image = np.expand_dims(image, axis=0)

    return image


def predict(image_path):

    interpreter = Interpreter(model_path=MODEL_PATH)
    print("Model loaded successfully", file=sys.stderr)

    interpreter.allocate_tensors()

    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    image = preprocess(image_path)

    image = image.astype(input_details[0]["dtype"])

    interpreter.set_tensor(
        input_details[0]["index"],
        image
    )

    interpreter.invoke()

    print(input_details, file=sys.stderr)

    prediction = interpreter.get_tensor(
        output_details[0]["index"]
    )[0]
    print(prediction, file=sys.stderr)

    for i, p in enumerate(prediction):
        print(f"{i}: {LABELS[i]} = {p:.6f}", file=sys.stderr)

    index = np.argmax(prediction)

    confidence = float(prediction[index]) * 100

    return {
        "plant_name":"Tomato",
        "disease":LABELS[index],
        "confidence":round(confidence,2),
        "health_score":health_score(LABELS[index])
    }


if __name__ == "__main__":

    if len(sys.argv) != 2:
        print(json.dumps({
            "error":"No image supplied"
        }))
        sys.exit(1)

    image_path = sys.argv[1]

    print(json.dumps(
        predict(image_path)
    ))

    # what does this do? It seems to be a script for predicting tomato plant diseases using a TensorFlow Lite model. It loads the model and labels, preprocesses an input image, runs the prediction, and returns the predicted disease along with confidence and health score.