from datetime import datetime
from botocore.exceptions import ClientError
from app.db import user_table

class User:
    @staticmethod
    def get_by_email(email: str):
        """Fetch a single user by their email (Partition Key)."""
        try:
            response = user_table.get_item(Key={'email': email})
            return response.get('Item')
        except ClientError as e:
            print(f"Error fetching user: {e}")
            return None

    @staticmethod
    def create(email: str, hashed_password: str, **kwargs):
        """Insert a new user item into the table."""
        item = {
            'email': email,
            'hashed_password': hashed_password,
            'is_active': kwargs.get('is_active', True),
            'stripe_customer_id': kwargs.get('stripe_customer_id'),
            'created_at': datetime.utcnow().isoformat(),
        }
        try:
            user_table.put_item(
                Item=item,
                ConditionExpression='attribute_not_exists(email)' # Prevent overwriting
            )
            return item
        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                raise Exception("User already exists.")
            raise e