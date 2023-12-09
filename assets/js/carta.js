class Fetcher {
    constructor() {
        this.data = null;
    }

    async fetchData(url, callback) {
        const response = await fetch(url);
        const data = await response.json();
        this.data = callback(data);
    }
}


class CitySheetBuilder {
    constructor() {
        this.citySize = {};
        this.marketSize = {};
    }

    scaleCity(establishedConnections) {
        for (let cityId in establishedConnections) {
            let connections = establishedConnections[cityId];
            this.citySize[cityId] = ((connections.length * (1/8)) * 10);
            this.marketSize[cityId] = Math.round((this.citySize[cityId]) + ((this.citySize[cityId]) / 5) * (Math.sqrt(this.citySize[cityId])));
        }
        return [this.citySize, this.marketSize];
    }

    organizeMarket(cityId) {
        let marketDiv = document.querySelector('.market');
        let productCount = this.marketSize[cityId];

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

class CityHandler {
    constructor(citySheet) {
        this.cityIcon = "assets/Imagens/Icone_cidade.svg";
        this.currentSelectedCity = null;
        this.iconsDiv = document.getElementById("icons");
        this.citySheet = citySheet;
    }

    createCities(connections, coordinatesArray) {
        for (let i = 0; i < coordinatesArray.length; i++) {
            let town = document.createElement("img");
            town.src = this.cityIcon;
            town.style.left = coordinatesArray[i][1][0] + "px";
            town.style.top = coordinatesArray[i][1][1] + "px";
            town.id = coordinatesArray[i][0];
            town.alt = coordinatesArray[i][2]
            town.onclick = () => this.handleCityClick(i, town, connections, coordinatesArray);
            this.iconsDiv.appendChild(town);
        }
    }

    handleCityClick(i, town, connections,coordinatesArray) {
        if (this.currentSelectedCity) {
            if (connections[this.currentSelectedCity.id] && connections[this.currentSelectedCity.id].includes(Number(town.id))) {
                this.currentSelectedCity.style.border = "none";
                town.style.border = "2px dashed darkred";
                town.style.borderRadius = "16px";
                town.style.padding = "2px";
                town.style.left = coordinatesArray[i][1][0] +  "px";
                town.style.top = coordinatesArray[i][1][1] +  "px";
                this.currentSelectedCity = town.alt;
                document.getElementById("city_name").innerHTML = this.currentSelectedCity;
                document.getElementById("city_region").innerHTML = coordinatesArray[i][3];
                this.citySheet.organizeMarket(town.id);
                this.currentSelectedCity = town;
            }
        } else {
            town.style.border = "2px dashed darkred";
            town.style.borderRadius = "16px";
            town.style.padding = "2px";
            town.style.left = coordinatesArray[i][1][0] +  "px";
            town.style.top = coordinatesArray[i][1][1] +  "px";
            this.currentSelectedCity = town.alt;
            document.getElementById("city_name").innerHTML = this.currentSelectedCity;
            document.getElementById("city_region").innerHTML = coordinatesArray[i][3];
            this.citySheet.organizeMarket(town.id);
            this.currentSelectedCity = town;
        }
    }
}

window.onload = async function() {
    const fetcher = new Fetcher();

    await fetcher.fetchData('http://127.0.0.1:5000/get_goods', data => {
        var products = data;
        return products;
    });

    await fetcher.fetchData('http://127.0.0.1:5000/get_connections', data => {
        var measures = data[0];
        var connections = data[1];
        var coordinatesArray = data[2];
        return { measures, connections, coordinatesArray };
    });

    const citySheet = new CitySheetBuilder();
    var [citySize, marketSize] = citySheet.scaleCity(fetcher.data.connections);

    const city = new CityHandler(citySheet);
    city.createCities(fetcher.data.connections, fetcher.data.coordinatesArray)
}


//get map coordinates
/*var allCoordinates = [];
function getCoordinates(event) {
    var iconsDiv = document.getElementById("icons");
    var rect = iconsDiv.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    var coordinates = "[" + x + ", " + Math.round(y) + "],";
    allCoordinates.push(coordinates);
    
    document.getElementById("coordinates").innerHTML = allCoordinates.join('<br>');
}*/