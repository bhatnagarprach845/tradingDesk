import boto3
from db import dynamodb, TABLE_NAME, IS_PROD

def create_user_table():
    try:
        print(f"Provisioning table: {TABLE_NAME}...")
        table = dynamodb.create_table(
            TableName=TABLE_NAME,
            KeySchema=[
                {'AttributeName': 'email', 'KeyType': 'HASH'} # Partition Key
            ],
            AttributeDefinitions=[
                {'AttributeName': 'email', 'AttributeType': 'S'} # S = String
            ],
            BillingMode='PAY_PER_REQUEST' # Serverless/On-demand scaling
        )
        print("Waiting for table to become active...")
        table.meta.client.get_waiter('table_exists').wait(TableName=TABLE_NAME)
        print("✅ Table created successfully.")
    except Exception as e:
        if "ResourceInUseException" in str(e):
            print(f"ℹ️ Table '{TABLE_NAME}' already exists.")
        else:
            raise e

if __name__ == "__main__":
    create_user_table()