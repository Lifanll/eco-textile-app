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
        content TEXT DEFAULT '',
        FOREIGN KEY(userId) REFERENCES user(id)
    )
""")
database.commit()

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
