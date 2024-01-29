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
            password="12345",
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
        self.routes_length = []
    
    def way(self):
        for i in range(len(self.cities)):
            for j in range(i+1, len(self.cities)):
                self.connections.append([self.cities[i], self.cities[j]])
        return self.connections
    
    def measure(self):
        for connection in self.connections:
            A = connection[0][1]
            B = connection[1][1]

            A_real = [962 - ((A[0]/100) * 962), 554 - ((A[1]/100) * 554)]
            B_real = [962 - ((B[0]/100) * 962), 554 - ((B[1]/100) * 554)]

            length_real = math.sqrt((B_real[0] - A_real[0])**2 + (B_real[1] - A_real[1])**2)

            if length_real < 71:
                self.measured_connections.append(connection)
                self.routes_length.append([[(A, connection[0][0]), (B, connection[1][0])], length_real])

        return self.measured_connections, self.routes_length

    
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

fetcher = Fetcher()
path = Routes()
city = City()
product = Product()

for id_city, nome, região, coordenada in fetcher.fetch("SELECT id, nomes, regiões, coords FROM cities"):
    path.cities.append([id_city, coordenada, nome, região])

for id_goods, goods, price, category, cities in fetcher.fetch("SELECT id, produtos, preço, categoria, cidades FROM goods"):
    product.goods_info.append((id_goods, goods, float(price), category, cities))

product.organize_categories()
path.way()
measured_connections, routes_lenght = path.measure()
established_connections = path.visualize()

city.scale_city(established_connections)

print(product.goods_info)

@app.route('/get_connections', methods=['GET'])
def get_connections():
    pack = [measured_connections, established_connections, path.cities, product.goods_info, routes_lenght]
    return jsonify(pack)

if __name__ == '__main__':
    app.run(debug=True)
