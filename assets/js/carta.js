import { initResizeElement, initDragElement, zoomInMap} from './onHands.js';

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
    constructor(products, userSheet) {
        this.citySize = {};
        this.marketSize = {};
        this.products = products;
        this.categoryFrequency = {};
        this.cityId = null;
        this.cityGoods = [];
        this.cityProducts = null;
        this.userSheet = userSheet;
    }

    scaleCity(establishedConnections) {
        for (let cityId in establishedConnections) {
            let connections = establishedConnections[cityId];
            this.citySize[cityId] = ((connections.length * (1/8)) * 10);
            this.marketSize[cityId] = Math.round((this.citySize[cityId]) + ((this.citySize[cityId]) / 5) * (Math.sqrt(this.citySize[cityId])));
        }
        return [this.citySize, this.marketSize];
    }

    organizeMarket(cityId, currentSelectedCity) {
        this.evaluateMarket(cityId);
    
        let marketDiv = document.querySelector('.market');
        let productCount = this.marketSize[cityId];
        let currentCity = [cityId, currentSelectedCity];
    
        marketDiv.innerHTML = '';
    
        for (let i = 0; i < productCount; i++) {
            let productInfoDiv = document.createElement('div');
            productInfoDiv.className = 'product_info';
            productInfoDiv.id = `product_${i}`;
    
            let productDataDiv = document.createElement('div');
            productDataDiv.className = 'product_data';
            productDataDiv.innerHTML = `<p>${this.cityGoods[i][1]}</p><p>Price: ${this.cityGoods[i][2]}</p>`;
            productInfoDiv.appendChild(productDataDiv);
    
            let productAccessDiv = document.createElement('div');
            productAccessDiv.className = 'product_access';
            productAccessDiv.innerHTML = `<input type="text" id="quantity_${i}" name="quantity" placeholder="Quantity">`;

            let buyButton = document.createElement('button');
            buyButton.id = `button_${i}`;
            buyButton.type = 'submit';
            buyButton.innerText = 'Buy';
    
            buyButton.addEventListener('click', () => this.userSheet.takeTransaction(`button_${i}`, this.cityGoods, currentCity));
    
            productAccessDiv.appendChild(buyButton);
            productInfoDiv.appendChild(productAccessDiv);
            marketDiv.appendChild(productInfoDiv);
        }
    }    

    evaluateMarket(cityId) {
        let cityProducts = this.products.filter(product => product[4].includes(Number(cityId)));
    
        if (cityProducts.length === 0) {
            this.cityGoods = [];
            return;
        }
    
        for (let i = cityProducts.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [cityProducts[i], cityProducts[j]] = [cityProducts[j], cityProducts[i]];
        }
    
        this.cityGoods = [];
    
        for (let product of cityProducts) {
            if (this.cityGoods.length < this.marketSize[cityId] && !this.cityGoods.some(good => good[0] === product[0])) {
                this.cityGoods.push(product);
            }
        }
    }
}

class CityHandler {
    constructor(citySheet, userSheet) {
        this.cityIcon = "assets/Img/Icone_cidade.svg";
        this.currentSelectedCity = null;
        this.iconsDiv = document.getElementById("icons");
        this.citySheet = citySheet;
        this.userSheet = userSheet;
        this.routes = document.querySelector('.routes');
        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    }

    createSvg() {
        this.svg.setAttribute("width", "inherit");
        this.svg.setAttribute("height", "inherit");
        this.routes.appendChild(this.svg);
    }

    drawLines(measures) {
        for (let i = 0; i < measures.length; i++) {
            let pointA = measures[i][0][1];
            let pointB = measures[i][1][1];

            var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", pointA[0] + "%");
            line.setAttribute("y1", pointA[1] + "%");
            line.setAttribute("x2", pointB[0] + "%");
            line.setAttribute("y2", pointB[1] + "%");
            line.setAttribute("stroke-width", "2");
            line.setAttribute("stroke", "black");
            this.svg.appendChild(line);
        }
    }


    createCities(connections, coordinatesArray) {
        for (let i = 0; i < coordinatesArray.length; i++) {
            let town = document.createElement("img");
            town.src = this.cityIcon;
            town.style.left = coordinatesArray[i][1][0] + "%";
            town.style.top = coordinatesArray[i][1][1] + "%";
            town.id = coordinatesArray[i][0];
            town.alt = coordinatesArray[i][2]
            town.onclick = () => this.handleCityClick(i, town, connections, coordinatesArray);
            this.iconsDiv.appendChild(town);
        }
    }

    handleCityClick(i, town, connections, coordinatesArray) {
        this.citySheet.cityId = town.id;
        if (this.currentSelectedCity) {
            if (connections[this.currentSelectedCity.id] && connections[this.currentSelectedCity.id].includes(Number(town.id))) {
                this.currentSelectedCity.style.border = "none";
                town.style.border = "2px dashed darkred";
                town.style.borderRadius = "16px";
                town.style.padding = "2px";
                town.style.left = coordinatesArray[i][1][0] +  "%";
                town.style.top = coordinatesArray[i][1][1] +  "%";
                this.currentSelectedCity = town.alt;
                document.getElementById("city_name").innerHTML = this.currentSelectedCity;
                document.getElementById("city_region").innerHTML = coordinatesArray[i][3];
                this.citySheet.organizeMarket(town.id, this.currentSelectedCity);
                this.userSheet.fillUserSheet([town.id, this.currentSelectedCity], true);
                this.currentSelectedCity = town;
            }
        } else {
            town.style.border = "2px dashed darkred";
            town.style.borderRadius = "16px";
            town.style.padding = "2px";
            town.style.left = coordinatesArray[i][1][0] +  "%";
            town.style.top = coordinatesArray[i][1][1] +  "%";
            this.currentSelectedCity = town.alt;
            document.getElementById("city_name").innerHTML = this.currentSelectedCity;
            document.getElementById("city_region").innerHTML = coordinatesArray[i][3];
            this.citySheet.organizeMarket(town.id, this.currentSelectedCity);
            this.currentSelectedCity = town;
        }
    }
}

class UserSheet {
    constructor() {
        this.wallet = 500;
        this.walletDisplay = document.getElementById('user_wallet');
        this.cart = [];
        this.cityPrices = {};
        this.currentCity = null;
    }

    createWallet() {
        this.walletDisplay.innerHTML = "Wallet: " + this.wallet.toFixed(2);
    }

    takeTransaction(buttonId, cityGoods, currentCity) {
        let productId = buttonId.split('_')[1];
        let quantity = Number(document.getElementById(`quantity_${productId}`).value);

        if (!isNaN(quantity) && quantity > 0 && this.wallet >= cityGoods[productId][2]*quantity) {
            this.wallet = this.wallet - (cityGoods[productId][2]*quantity);

            let productInCart = this.cart.find(item => item[0] === cityGoods[productId][0]);

            if (productInCart) {
                productInCart[5] += quantity;
            } else {
                let productWithQuantity = [...cityGoods[productId], quantity];
                this.cart.push(productWithQuantity);
            }
        } 
        this.fillUserSheet(currentCity, false)
    }

    fillUserSheet(currentCity, reajust) {
        this.createWallet()

        const cartSpace = document.querySelector('.cart');
        cartSpace.innerHTML = '';
    
        this.cart.forEach((item, i) => {
            let price;
            if (reajust || typeof this.cityPrices[currentCity] === 'undefined' || !this.cityPrices[currentCity].hasOwnProperty(item[1])) {
                price = this.calculateSellingPrices(item, currentCity);
                this.currentCity = currentCity;
            } else {
                price = this.cityPrices[currentCity][item[1]].price;
            }

            const cartItemDiv = document.createElement('div');
            cartItemDiv.className = 'cart_item';
            cartItemDiv.id = `cart_item_${i}`;
    
            const cartItemTop = document.createElement('div');
            cartItemTop.className = 'sub_cart_item';
            cartItemTop.id = `top_${i}`;
            cartItemTop.innerHTML = `<p>${item[1]}</p><p>Price: ${price.toFixed(2)}</p>`;
    
            const cartItemBot = document.createElement('div');
            cartItemBot.className = 'sub_cart_item';
            cartItemBot.id = `bot_${i}`;
            cartItemBot.innerHTML = `<p id="qt_${i}" class="qt">${item[5]}Qt</p><input type="text" id="sellQuantity_${i}" name="quantity" placeholder="Quantity">`;
    
            const sellButton = document.createElement('button');
            sellButton.id = `sell_${i}`;
            sellButton.type = 'submit';
            sellButton.innerText = 'Sell';
            sellButton.addEventListener('click', () => this.sellGood(price, item[5], i, currentCity));
    
            cartItemBot.appendChild(sellButton);
            cartItemDiv.append(cartItemTop, cartItemBot);
            cartSpace.appendChild(cartItemDiv);
        });
    }
    
    sellGood(price, availableQuantity, item, currentCity) {
        const soldQuantity = Number(document.getElementById(`sellQuantity_${item}`).value);
        const qt = document.getElementById(`qt_${item}`);
    
        if (soldQuantity > availableQuantity) {
            console.log('impossible');
        } else {
            this.wallet += price * soldQuantity;
            if (soldQuantity === availableQuantity || availableQuantity <= 0) {
                this.cart.splice(item, 1);
                this.fillUserSheet(currentCity);
            } else {
                this.cart[item][5] -= soldQuantity;
                qt.innerHTML = this.cart[item][5];
            }
            this.createWallet();
        }
    }

    calculateSellingPrices(item, currentCity) {
        const randomValue = Math.random() / 10;
        let adjustmentFactor = item[4].includes(Number(currentCity[0])) ? 1 - randomValue : 1 + randomValue;
    
        adjustmentFactor = Math.max(0.9, Math.min(1.1, adjustmentFactor));
    
        if (!this.cityPrices[currentCity]) {
            this.cityPrices[currentCity] = {};
        }
    
        if (!this.cityPrices[currentCity][item[1]]) {
            this.cityPrices[currentCity][item[1]] = {price: item[2], count: 0};
        }
    
        let price;
        if (this.cityPrices[currentCity][item[1]].count > 0) {
            adjustmentFactor = Math.max(0.95, Math.min(1.05, adjustmentFactor));
            price = item[2] * adjustmentFactor;
        } else {
            price = item[2] * adjustmentFactor;
        }
        
        this.cityPrices[currentCity][item[1]].price = price;
        this.cityPrices[currentCity][item[1]].count += 1;
    
        return price;
    }
}

var measures = [[[7, [39.28, 86.8], 'Lyafssarth', 'Siourin'], [8, [37.8, 79.3], 'Bryssdeith', 'Siourin']], [[7, [39.28, 86.8], 'Lyafssarth', 'Siourin'], [5, [35.72, 84.97], 'Alcirouth', 'Siourin']], [[8, [37.8, 79.3], 'Bryssdeith', 'Siourin'], [5, [35.72, 84.97], 'Alcirouth', 'Siourin']], [[8, [37.8, 79.3], 'Bryssdeith', 'Siourin'], [4, [31.18, 81.7], 'Zouvien', 'Siourin']], [[1, [24.2, 92.5], 'Irith', 'Siourin'], [3, [24.65, 83.2], 'Haeickssa', 'Siourin']], [[1, [24.2, 92.5], 'Irith', 'Siourin'], [2, [31.0, 88.5], 'Saebaran', 'Siourin']], [[3, [24.65, 83.2], 'Haeickssa', 'Siourin'], [2, [31.0, 88.5], 'Saebaran', 'Siourin']], [[3, [24.65, 83.2], 'Haeickssa', 'Siourin'], [4, [31.18, 81.7], 'Zouvien', 'Siourin']], [[5, [35.72, 84.97], 'Alcirouth', 'Siourin'], [2, [31.0, 88.5], 'Saebaran', 'Siourin']], [[5, [35.72, 84.97], 'Alcirouth', 'Siourin'], [4, [31.18, 81.7], 'Zouvien', 'Siourin']], [[5, [35.72, 84.97], 'Alcirouth', 'Siourin'], [6, [32.8, 94.3], 'Driezmaran', 'Siourin']], [[2, [31.0, 88.5], 'Saebaran', 'Siourin'], [4, [31.18, 81.7], 'Zouvien', 'Siourin']], [[2, [31.0, 88.5], 'Saebaran', 'Siourin'], [6, [32.8, 94.3], 'Driezmaran', 'Siourin']]];
var connections = {7: [8, 5], 8: [7, 5, 4], 5: [7, 8, 2, 4, 6], 4: [8, 3, 5, 2], 1: [3, 2], 3: [1, 2, 4], 2: [1, 3, 5, 4, 6], 6: [5, 2]};
var coordinatesArray = [[7, [39.28, 86.8], 'Lyafssarth', 'Siourin'], [8, [37.8, 79.3], 'Bryssdeith', 'Siourin'], [1, [24.2, 92.5], 'Irith', 'Siourin'], [3, [24.65, 83.2], 'Haeickssa', 'Siourin'], [5, [35.72, 84.97], 'Alcirouth', 'Siourin'], [2, [31.0, 88.5], 'Saebaran', 'Siourin'], [4, [31.18, 81.7], 'Zouvien', 'Siourin'], [6, [32.8, 94.3], 'Driezmaran', 'Siourin']];
var products = [(1, 'Brick', 20.0, 'Building', [1, 2, 4, 5, 8]), (18, 'Glass', 60.0, 'Building', [1, 4, 5, 8]), (20, 'Wood', 23.0, 'Building', [1, 2, 3, 4, 5, 6, 7, 8]), (3, 'Wheat', 10.0, 'Food', [1, 2, 3, 4, 5, 7]), (6, 'Wine', 30.0, 'Food', [1, 4, 5, 7]), (7, 'Spices', 80.0, 'Food', [1, 4, 8]), (10, 'Oil', 25.0, 'Food', [3, 7]), (12, 'Salt', 10.0, 'Food', [1, 4, 8]), (14, 'Cheese', 20.0, 'Food', [1, 2, 3, 4, 5, 6]), (17, 'Honey', 18.0, 'Food', [1, 4, 5, 8]), (19, 'Milk', 5.0, 'Food', [1, 2, 3, 4, 5, 6]), (16, 'Coal', 15.0, 'Fuel', [2, 5, 6, 7]), (5, 'Iron', 40.0, 'Metal', [2, 5, 6, 7]), (9, 'Gold', 200.0, 'Metal', [2, 6, 7]), (13, 'Silver', 120.0, 'Metal', [2, 6, 7, 8]), (2, 'Copper', 80.0, 'Metal', [2, 5, 6, 8]), (4, 'Wool', 15.0, 'Textile', [3, 4, 6, 7, 8]), (8, 'Silk', 100.0, 'Textile', [1, 4, 8]), (11, 'Leather', 35.0, 'Textile', [3, 6, 7]), (15, 'Cotton', 50.0, 'Textile', [3, 4, 6, 7]), (21, 'Stone', 25.0, 'Building', [2, 3, 5, 6, 7]), (22, 'Fish', 12.0, 'Food', [1, 3, 4, 8]), (23, 'Flour', 8.0, 'Food', [1, 2, 3, 4, 5, 7]), (24, 'Linen', 40.0, 'Textile', [3, 4, 5, 7, 8])];

window.onload = async function() {
    
    const userSheet = new UserSheet();
    userSheet.createWallet();

    const citySheet = new CitySheetBuilder(products, userSheet);
    var [citySize, marketSize] = citySheet.scaleCity(connections);

    const city = new CityHandler(citySheet, userSheet);
    city.createCities(connections, coordinatesArray)

    city.createSvg();
    city.drawLines(measures);

    initDragElement();
    initResizeElement();
}

var zoom = new zoomInMap();
zoom.activateZoom();
zoom.activateDrag();