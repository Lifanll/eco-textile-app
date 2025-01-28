import sqlite3

# connect to database
database = sqlite3.connect('my_database.db')
cursor = database.cursor()

# Create user table
cursor.execute("""
    CREATE TABLE user(
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        username TEXT NOT NULL UNIQUE, 
        password TEXT
    )
""")
database.commit()

# Create conversation table
cursor.execute("""
    CREATE TABLE conversation(
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        userId INTEGER, 
        title TEXT NOT NULL, 
        summary TEXT,
        FOREIGN KEY(userId) REFERENCES user(id)
    )
""")
database.commit()

# Create message table to store messages in conversation
cursor.execute("""
    CREATE TABLE message (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversationId INTEGER,
        isUser BOOLEAN NOT NULL,
        image TEXT,
        message TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(conversationId) REFERENCES conversation(id)           
    )
""")

# Correct image table
cursor.execute("""
    CREATE TABLE image(
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        conversationId INTEGER, 
        line INTEGER, 
        path TEXT UNIQUE, 
        FOREIGN KEY(conversationId) REFERENCES conversation(id)
    )
""")
database.commit()

database.close()
