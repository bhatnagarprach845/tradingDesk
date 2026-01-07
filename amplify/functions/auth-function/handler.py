import json


def handler(event, context):
    """
    Standard Lambda handler for Python.
    'event' contains the data passed to the function (like email/password).
    'context' provides runtime information.
    """
    print("Received event:", json.dumps(event))

    # Example logic to extract arguments if called via Amplify Data (GraphQL)
    arguments = event.get('arguments', {})
    email = arguments.get('email')
    password = arguments.get('password')

    # Your custom auth or business logic here
    # For now, we'll return a dummy token
    if email and password:
        return f"fake-jwt-token-for-{email}"

    return {
        'statusCode': 400,
        'body': json.dumps('Missing email or password')
    }