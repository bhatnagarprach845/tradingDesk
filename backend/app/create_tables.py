from app.db import engine, Base
from app import models

def main():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Done.")

if __name__ == "__main__":
    main()