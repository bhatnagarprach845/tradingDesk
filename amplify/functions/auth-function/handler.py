import json
import jwt
import datetime
import os

# SECRET_KEY should be set in Amplify Console -> Hosting -> Secrets
# For local sandbox, use: npx ampx sandbox secret set JWT_SECRET
SECRET_KEY = os.environ.get("JWT_SECRET")
ALGORITHM = "HS256"


def handler(event, context):
    print("Received event:", json.dumps(event))

    arguments = event.get('arguments', {})
    email = arguments.get('email')
    password = arguments.get('password')

    # 1. Validate credentials (your logic here)
    if not email or not password:
        raise Exception("Missing email or password")

    # Example validation: replace this with your DB check
    if email == "test@example.com" and password == "password123":

        # 2. Create the JWT Payload
        payload = {
            "sub": email,  # Subject (unique identifier)
            "iat": datetime.datetime.utcnow(),  # Issued At
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24),  # Expiration
            "role": "user"  # Custom claim
        }

        # 3. Encode the token
        try:
            token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

            # Since your AppSync schema likely expects a string return:
            return token

        except Exception as e:
            print(f"Token generation failed: {e}")
            raise Exception("Internal server error")

    # If auth fails
    raise Exception("Invalid email or password")