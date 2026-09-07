import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base,sessionmaker
URL=os.getenv("HAULMATCH_DATABASE_URL","sqlite:///./data/haulmatch360.db");engine=create_engine(URL,connect_args={"check_same_thread":False} if URL.startswith("sqlite") else {});SessionLocal=sessionmaker(bind=engine,autocommit=False,autoflush=False);Base=declarative_base()
def get_db():
 d=SessionLocal()
 try:yield d
 finally:d.close()
