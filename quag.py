from flask import Flask, jsonify
from flask_cors import CORS
import psycopg2

app = Flask(__name__)
CORS(app)

import psycopg2

class Fetcher:
    def __init__(self):
        self.connection = psycopg2.connect(
            database="Quagmire VV",
            user="postgres",
            password="123456",
            host="localhost",
            port="5433"
        )

    def fetch(self, query):
        cursor = self.connection.cursor()
        cursor.execute(query)
        return cursor.fetchall()


fetcher = Fetcher()
coordenadas = []
for i in fetcher.fetch("SELECT coordenadas FROM quagmire_cities"):
    coordenadas.append(i[0])
print(coordenadas)

@app.route('/get_coordinates', methods=['GET'])
def get_coordinates():
    return jsonify(coordenadas)

if __name__ == '__main__':
    app.run(debug=True)