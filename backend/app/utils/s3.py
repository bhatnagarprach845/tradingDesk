import boto3
import os
import io

s3 = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION"),
)

BUCKET = os.getenv("FIFO_RESULTS_BUCKET")


def upload_csv_to_s3(df, key: str):
    buffer = io.StringIO()
    df.to_csv(buffer, index=False)
    buffer.seek(0)

    s3.put_object(
        Bucket=BUCKET,
        Key=key,
        Body=buffer.getvalue(),
        ContentType="text/csv",
    )


def generate_signed_url(key: str, expires=3600):
    return s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": BUCKET, "Key": key},
        ExpiresIn=expires,
    )
