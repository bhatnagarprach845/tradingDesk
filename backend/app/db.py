# backend/app/db.py
import boto3
import os
from dotenv import load_dotenv

if os.getenv("PROD_ENV") != "production":
    load_dotenv()

IS_PROD = os.getenv("PROD_ENV") == "production"
REGION = os.getenv("AWS_REGION", "us-east-1")

def get_dynamodb_resource():
    if IS_PROD:
        return boto3.resource('dynamodb', region_name=REGION)
    else:
        # LOCAL: Connect to DynamoDB Local
        # IMPORTANT: Use alphanumeric keys only (no underscores)
        return boto3.resource(
            'dynamodb',
            region_name=REGION,
            endpoint_url=os.getenv("DYNAMODB_LOCAL_URL", "http://localhost:8000"),
            aws_access_key_id="accesskey",        # Changed from local_key
            aws_secret_access_key="secretkey",    # Changed from local_secret
        )

dynamodb = get_dynamodb_resource()
TABLE_NAME = os.getenv("USER_TABLE_NAME", "users")
user_table = dynamodb.Table(TABLE_NAME)