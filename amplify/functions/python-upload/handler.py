# amplify/functions/python-upload/handler.py
import json
from fifo_engine import parse_csv_text, fifo_match_with_lot_ids, reset_lot_counter


def handler(event, context):
    try:
        # 1. Reset global counter (Lambdas are reused; we want fresh IDs each call)
        reset_lot_counter()

        # 2. Extract the raw CSV text from the GraphQL arguments
        # The key 'csvData' must match what you define in your schema
        csv_text = event.get('arguments', {}).get('csvData')

        if not csv_text:
            return json.dumps({"error": "No CSV data received"})

        # 3. Parse the text into transaction dictionaries
        transactions = parse_csv_text(csv_text)

        if not transactions:
            return json.dumps({"error": "CSV was empty or invalid format"})

        # 4. Run the FIFO matching logic
        result = fifo_match_with_lot_ids(transactions)

        # 5. Return the full result object as a JSON string
        return json.dumps(result)

    except Exception as e:
        print(f"Lambda Error: {str(e)}")
        return json.dumps({"error": str(e)})