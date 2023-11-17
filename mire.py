from flask import Flask, jsonify
from flask_cors import CORS
import psycopg2

app = Flask(__name__)
CORS(app)

class Fetcher:
    def __init__(self):
        self.connection = psycopg2.connect(
            database="Quagmire",
            user="postgres",
            password="Yuri.0025",
            host="localhost",
            port="5432"
        )

    def fetch(self, query):
        cursor = self.connection.cursor()
        cursor.execute(query)
        return cursor.fetchall()  

fetcher = Fetcher()
coordenadas = []
for id, coordenada in fetcher.fetch("SELECT id, coords FROM cities"):
    coordenadas.append(coordenada)
print(coordenadas)

@app.route('/get_coordinates', methods=['GET'])
def get_coordinates():
    return jsonify(coordenadas)

if __name__ == '__main__':
    app.run(debug=True)