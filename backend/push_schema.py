from sqlalchemy import create_engine
from app.models import Base  # Import your Base where the User model is registered

# Use the same RDS URL you used for the Amplify secret
DATABASE_URL = "postgresql://postgres:magical845@database-1.c8lmw2o8m6ft.us-east-1.rds.amazonaws.com:5432/postgres"

engine = create_engine(DATABASE_URL)

print("Connecting to RDS and creating tables...")
# This command looks at all classes inheriting from Base and creates them in RDS
Base.metadata.create_all(bind=engine)
print("Success! Tables created.")