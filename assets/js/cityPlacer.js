class City {
    constructor() {
        this.size = {};
        this.marketSize = {};
    }

    scaleCity(establishedConnections) {
        for (let cityId in establishedConnections) {
            let connections = establishedConnections[cityId];
            this.size[cityId] = ((connections.length * (1/8)) * 10);
            this.marketSize[cityId] = Math.round((this.size[cityId]) + ((this.size[cityId]) / 5) * (Math.sqrt(this.size[cityId])));
        }
        
        return [this.size, this.marketSize];
    }

    organizeMarket(marketSize, cityId) {
        let marketDiv = document.querySelector('.market');
        let productCount = marketSize[cityId];

        marketDiv.innerHTML = '';

        for (let i = 0; i < productCount; i++) {
            let productInfoDiv = document.createElement('div');
            productInfoDiv.className = 'product_info';

            let productDataDiv = document.createElement('div');
            productDataDiv.className = 'product_data';
            productDataDiv.innerHTML = '<p>Nome</p><p>Preço: 9,99</p>';
            productInfoDiv.appendChild(productDataDiv);

            let productAccessDiv = document.createElement('div');
            productAccessDiv.className = 'product_access';
            productAccessDiv.innerHTML = '<input type="text" id="quantity" name="quantity" placeholder="Quantity"><button type="submit">Buy</button>';
            productInfoDiv.appendChild(productAccessDiv);

            marketDiv.appendChild(productInfoDiv);
        }
    }
}

class Visualizer {
    constructor() {
        this.imageUrl = "assets/Imagens/Icone_cidade.svg";
        this.currentSelectedImg = null;
        this.currentSelectedCity = null;
        this.svg = null;
        this.routes = null;
        this.connections = null;
        this.coordinatesArray = [];
        this.iconsDiv = document.getElementById("icons");
        this.citySize = null;
        this.markets = null;
    }

    fetchData() {
        return fetch('http://127.0.0.1:5000/get_connections')
            .then(response => response.json())
            .then(data => {
                this.connections = data[1];
                this.coordinatesArray = data[2]
                return data[0];
            });
    }

    createSvg() {
        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.routes = document.querySelector('.routes');
        this.svg.setAttribute("width", "1430");
        this.svg.setAttribute("height", "900");
        this.routes.appendChild(this.svg);
    }

    drawLines(measures) {
        for (let i = 0; i < measures.length; i++) {
            let pointA = measures[i][0][1];
            let pointB = measures[i][1][1];

            var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", pointA[0]);
            line.setAttribute("y1", pointA[1]);
            line.setAttribute("x2", pointB[0]);
            line.setAttribute("y2", pointB[1]);
            line.setAttribute("stroke-width", "2");
            line.setAttribute("stroke", "black");
            this.svg.appendChild(line);
        }
    }

    createIcons() {
        this.city = new City();
        this.goods = new Goods();
        [this.citySize, this.markets] = this.city.scaleCity(this.connections);
        this.goods.fetchGoods();
        for (let i = 0; i < this.coordinatesArray.length; i++) {
            let img = document.createElement("img");
            img.src = this.imageUrl;
            img.style.left = this.coordinatesArray[i][1][0] + "px";
            img.style.top = this.coordinatesArray[i][1][1] + "px";
            img.id = this.coordinatesArray[i][0];
            img.alt = this.coordinatesArray[i][2]
            img.onclick = () => this.handleIconClick(i, img);
            this.iconsDiv.appendChild(img);
        }
    }

    handleIconClick(i, img) {
        if (this.currentSelectedImg) {
            if (this.connections[this.currentSelectedImg.id] && this.connections[this.currentSelectedImg.id].includes(Number(img.id))) {
                this.currentSelectedImg.style.border = "none";
                img.style.border = "2px dashed darkred";
                img.style.borderRadius = "16px";
                img.style.padding = "2px";
                img.style.left = this.coordinatesArray[i][1][0] +  "px";
                img.style.top = this.coordinatesArray[i][1][1] +  "px";
                this.currentSelectedCity = img.alt;
                document.getElementById("city_name").innerHTML = this.currentSelectedCity;
                document.getElementById("city_region").innerHTML = this.coordinatesArray[i][3];
                this.city.organizeMarket(this.markets, img.id);
                this.currentSelectedImg = img;
                this.goods.placeGoods(this.citySize[this.currentSelectedImg.id], this.markets[this.currentSelectedImg.id]);
            }
        } else {
            img.style.border = "2px dashed darkred";
            img.style.borderRadius = "16px";
            img.style.padding = "2px";
            img.style.left = this.coordinatesArray[i][1][0] + "px";
            img.style.top = this.coordinatesArray[i][1][1] + "px";
            this.currentSelectedCity = img.alt;
            document.getElementById("city_name").innerHTML = this.currentSelectedCity;
            document.getElementById("city_region").innerHTML = this.coordinatesArray[i][3];
            this.city.organizeMarket(this.markets, img.id);
            this.currentSelectedImg = img;
            this.goods.placeGoods(this.citySize[this.currentSelectedImg.id], this.markets[this.currentSelectedImg.id]);
        }
    }

    visualize() {
        this.fetchData().then(measures => {
            this.createSvg();
            this.drawLines(measures);
            this.createIcons();
        });
    }
}

class Goods {
    constructor() {
        this.products = null;
    }

    fetchGoods() {
        return fetch('http://127.0.0.1:5000/get_goods')
            .then(response => response.json())
            .then(data => {
                this.products = data;
            });
    }

    placeGoods(citySize, marketSize) {
        // Create a frequency map of the categories
        let categoryFrequency = {};
        for (let product of this.products) {
            let category = product[3];
            if (category in categoryFrequency) {
                categoryFrequency[category]++;
            } else {
                categoryFrequency[category] = 1;
            }
        }

        // Find the most abundant category
        let mostAbundantCategory = Object.keys(categoryFrequency).reduce((a, b) => categoryFrequency[a] > categoryFrequency[b] ? a : b);

        // Filter the products by the most abundant category
        let filteredProducts = this.products.filter(product => product[3] === mostAbundantCategory);

        // Sort the filtered products by price in ascending order
        let sortedProducts = filteredProducts.sort((a, b) => a[2] - b[2]);

        // Determine the index to split the array into common and exceptional goods
        let splitIndex = Math.floor(sortedProducts.length * (citySize - 2.5) / 3.75);

        // Split the array into common and exceptional goods
        let commonGoods = sortedProducts.slice(0, splitIndex);
        let exceptionalGoods = sortedProducts.slice(splitIndex);

        // Select goods for the city
        let cityGoods = [];
    }
}

window.onload = function() {

    let visualizer = new Visualizer();
    visualizer.visualize()

}  

var allCoordinates = [];
function getCoordinates(event) {
    var iconsDiv = document.getElementById("icons");
    var rect = iconsDiv.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    var coordinates = "[" + x + ", " + Math.round(y) + "],";
    allCoordinates.push(coordinates);
    
    document.getElementById("coordinates").innerHTML = allCoordinates.join('<br>');
}