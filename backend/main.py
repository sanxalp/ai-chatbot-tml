from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    message = data.get("message", "")
    
    # For now, just echo back a dummy response
    return jsonify({"response": f"Bot says: You said '{message}'"})

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8000)
