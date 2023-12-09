from flask import Flask, jsonify
from flask_cors import CORS
import psycopg2
import math

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

class Routes:
    def __init__(self):
        self.cities = []
        self.connections = []
        self.measured_connections = []
        self.established_connections = {}
    
    def way(self):
        for i in range(len(self.cities)):
            for j in range(i+1, len(self.cities)):
                self.connections.append([self.cities[i], self.cities[j]])
        return self.connections
    
    def measure(self):
        for connection in self.connections:
            A = connection[0][1]
            B = connection[1][1]
            length = math.sqrt((B[0] - A[0])**2 + (B[1] - A[1])**2)

            if length < 108:
                self.measured_connections.append(connection)
                    
        return self.measured_connections
    
    def visualize(self):
        for connection in self.measured_connections:
            cityA_id = connection[0][0]
            cityB_id = connection[1][0]
            if cityA_id not in self.established_connections:
                self.established_connections[cityA_id] = []
            if cityB_id not in self.established_connections:
                self.established_connections[cityB_id] = []
            self.established_connections[cityA_id].append(cityB_id)
            self.established_connections[cityB_id].append(cityA_id)
        
        return self.established_connections

class City:
    def __init__(self):
        self.size = {}
        self.market_size = {}

    def scale_city(self, established_connections):
        for city_id, connections in established_connections.items():
            self.size[city_id] = ((len(connections)*(1/8))*10)
            self.market_size[city_id] = round((self.size[city_id])+((self.size[city_id])/5)*(math.sqrt(self.size[city_id])))
        
        return self.size, self.market_size

class Product:
    def __init__(self):
        self.goods_info = []

    def organize_categories(self):
        organized_goods = sorted(self.goods_info, key=lambda x: x[3])
        print(organized_goods)

fetcher = Fetcher()
path = Routes()
city = City()
product = Product()

for id_city, coordenada, nome, região in fetcher.fetch("SELECT id, coords, nomes, regiões FROM cities"):
    path.cities.append([id_city, coordenada, nome, região])

for id_goods, goods, price, category in fetcher.fetch("SELECT id, produtos, preço, categoria FROM goods"):
    product.goods_info.append((id_goods, goods, float(price), category))

product.organize_categories()
path.way()
measured_connections = path.measure()
established_connections = path.visualize()

city.scale_city(established_connections)

@app.route('/get_connections', methods=['GET'])
def get_connections():
    pack = [measured_connections, established_connections, path.cities]
    return jsonify(pack)

@app.route('/get_goods', methods=['GET'])
def get_goods():
    return jsonify(product.goods_info)

if __name__ == '__main__':
    app.run(debug=True)