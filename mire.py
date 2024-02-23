from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import math
import json

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

            if length_real < 78 and (not(connection[0][2] == 'Eil Grumm' and connection[1][2] == 'Nuomin' )):
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
        self.quality_modifiers = 100

    def organize_categories(self):
        org_goods = sorted(self.goods_info, key=lambda x: x[3])
        return org_goods

    def qualify(self):
        self.goods_info = self.organize_categories()
        for good in self.goods_info:
            good.append(self.quality_modifiers)

fetcher = Fetcher()
path = Routes()
city = City()
product = Product()

for id_city, nome, região, coordenada in fetcher.fetch("SELECT id, nomes, regiões, coords FROM cities"):
    path.cities.append([id_city, coordenada, nome, região])

for id_goods, goods, price, category, cities, quality in fetcher.fetch("SELECT id, produtos, preço, categoria, cidades, qualidade FROM goods"):
    product.goods_info.append([id_goods, goods, float(price), category, cities, quality])

path.way()
measured_connections, routes_length = path.measure()
established_connections = path.visualize()

city.scale_city(established_connections)

product.qualify()

class DataProcessing:
    def __init__(self):
        self.travel_log = []
        self.followed_path = []
        self.mapped_exchanges = {}

    def control_data(self, travel_log):
        self.mapped_exchanges = travel_log[1]
        print(self.mapped_exchanges)
        if not self.travel_log:
            self.travel_log = travel_log
            self.process_route()
        elif self.travel_log[0] != travel_log[0]:
            if self.travel_log[0][:len(travel_log[0])] == travel_log[0]:
                self.travel_log[0] += travel_log[0][len(self.travel_log[0]):]
            else:
                self.travel_log[0] = travel_log[0]
            self.process_route()

    def process_route(self):
        self.followed_path = []

        for index, location in enumerate(self.travel_log[0]):
            if not self.followed_path or location != self.followed_path[-1][0]:
                self.followed_path.append((location, 'trace' if index < (len(self.travel_log[0])-1) else []))
        self.calculate_route()

        return self.followed_path
    
    def calculate_route(self):
        for index, j in enumerate(self.followed_path[:-1]):
            for i in routes_length:
                if (i[0][0][1] == int(j[0][0]) and i[0][1][1] == int(self.followed_path[index+1][0][0])) or (i[0][1][1] == int(j[0][0]) and i[0][0][1] == int(self.followed_path[index+1][0][0])):
                    self.followed_path[index] = (j[0], i[1])

processor = DataProcessing()

def create_json():
    data = {'measures': measured_connections, 'connections': established_connections, 'paths': path.cities, 'goods': product.goods_info, 'routes': routes_length}
    with open('data.json', 'w') as d:
        json.dump(data, d)
    print("we are actually doing it")

create_json()
#@app.route('/get_data', methods=['GET'])
#def get_data():
#    pack = [measured_connections, established_connections, path.cities, product.goods_info, routes_length]
#    print(pack)
#    return jsonify(pack)

last_error = None

@app.route('/send_data', methods=['POST'])
def send_data():
    global last_error
    travel_log = request.get_json()
    try:
        processor.control_data(travel_log)
    except Exception as e:
        last_error = str(e)
        print('Problem in Travel Log:', last_error)
    return jsonify({'status': 'success'}), 200

@app.route('/visualize_data', methods=['GET'])
def visualize_data():
    global last_error
    if last_error is not None:
        return jsonify({'error': last_error}), 500
    else:
        return jsonify({'followed_path': processor.followed_path},
                       {'exchanges': processor.mapped_exchanges})

if __name__ == '__main__':
    app.run(debug=True)
