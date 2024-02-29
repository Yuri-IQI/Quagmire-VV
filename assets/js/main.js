import { initResizeElement, initDragElement, ZoomInMap } from './handsOn.js';
var travelLog = [[]];

class JsonFetcher {
    constructor(url) {
      this.url = url;
      this.data;
    }
  
    async fetchData() {
      try {
        const response = await fetch(this.url);
        if (!response.ok) {
          throw new Error(`No response: ${response.status}`);
        }
        const jsonData = await response.json();
        this.data = {
          measures: jsonData.measures,
          connections: jsonData.connections,
          coordinatesArray: jsonData.paths,
          products: jsonData.goods,
          routesLength: jsonData.routes,
        };
        return this.data;
      } catch (error) {
        console.error("Error fetching data:", error);
        throw error;
      }
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
        this.currentSelectedCity = null;
        this.iconsDiv = document.getElementById("icons");
        this.citySheet = citySheet;
        this.userSheet = userSheet;
        this.routes = document.querySelector('.routes');
        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.cityCount = 0;
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
            town.src = i % 2 == 0 ? 'assets/Img/icone_cidade.svg' : 'assets/Img/um_pouco_de_diferença.svg';
            town.style.left = coordinatesArray[i][1][0] + "%";
            town.style.top = coordinatesArray[i][1][1] + "%";
            town.id = coordinatesArray[i][0];
            town.alt = coordinatesArray[i][2]

            let cityName = document.createElement("p");
            cityName.innerHTML = town.alt;
            cityName.style.position = "absolute";
            cityName.style.left = coordinatesArray[i][1][0] + "%";
            cityName.style.top = coordinatesArray[i][1][1] - 0.4 + "%";
            cityName.style.zIndex = 10;

            cityName.onclick = () => this.handleCityClick(i, town, connections, coordinatesArray);

            this.iconsDiv.appendChild(cityName);
            this.iconsDiv.appendChild(town);
        }
    }

    handleCityClick(i, town, connections, coordinatesArray) {
        this.citySheet.cityId = town.id;
        if (this.currentSelectedCity) {
            if (connections[this.currentSelectedCity.id] && connections[this.currentSelectedCity.id].includes(Number(town.id))) {
                this.updateSelectedCity(i, town, connections, coordinatesArray);
            }
        } else {
            this.initializeSelectedCity(i, town, coordinatesArray);
        }        
    }

    updateSelectedCity(i, town, connections, coordinatesArray) {
        this.currentSelectedCity.style.border = "none";
        this.updateTownStyle(town, coordinatesArray, i);
        this.updateTravelLog(i, town, coordinatesArray);
        this.updateDOMElements(town, coordinatesArray, i);
        this.citySheet.organizeMarket(town.id, town.alt);                
        this.userSheet.calculateTravelledDistance(this.currentSelectedCity.id, town.id);
        this.currentSelectedCity = town;
    }

    initializeSelectedCity(i, town, coordinatesArray) {
        this.updateTownStyle(town, coordinatesArray, i);
        let townName = town.alt;
        let userWallet = this.userSheet.wallet.toFixed(2);
        travelLog[1] = {[townName] : {[this.cityCount] : [userWallet]}};
        this.updateDOMElements(town, coordinatesArray, i);
        this.citySheet.organizeMarket(town.id, townName);
        this.currentSelectedCity = town;
    }

    updateTownStyle(town, coordinatesArray, i) {
        Object.assign(town.style, {
            border: "2px dashed darkred",
            borderRadius: "16px",
            padding: "2px",
            left: `${coordinatesArray[i][1][0]}%`,
            top: `${coordinatesArray[i][1][1]}%`
        });
    }

    updateTravelLog(i, town, coordinatesArray) {
        var currentCityArray = coordinatesArray.find(city => city.includes(parseInt(this.currentSelectedCity.id))); 
        travelLog[0].push(
            [this.currentSelectedCity.id, this.currentSelectedCity.alt, currentCityArray[3]],
            [town.id, town.alt, coordinatesArray[i][3]]
        );
        this.userSheet.fillUserSheet([town.id, town.alt], true);
        if (!travelLog[1][this.currentSelectedCity.alt]) {
            travelLog[1][this.currentSelectedCity.alt] = {};
        }
        if (!travelLog[1][this.currentSelectedCity.alt][this.cityCount]) {
            travelLog[1][this.currentSelectedCity.alt][this.cityCount] = [this.userSheet.wallet.toFixed(2)];
        } else {
            travelLog[1][this.currentSelectedCity.alt][this.cityCount].push(this.userSheet.wallet.toFixed(2));
        }
        if (!travelLog[1][town.alt]) {
            travelLog[1][town.alt] = {};
        }
        if (typeof travelLog[1][town.alt][this.cityCount] == 'undefined') {
            this.counter();
            travelLog[1][town.alt][this.cityCount] = [this.userSheet.wallet.toFixed(2)];
        } else {
            this.counter();
            if (!travelLog[1][town.alt][this.cityCount]) {
                travelLog[1][town.alt][this.cityCount] = [this.userSheet.wallet.toFixed(2)];
            } else {
                travelLog[1][town.alt][this.cityCount].push(this.userSheet.wallet.toFixed(2));
            }
        }
    }

    updateDOMElements(town, coordinatesArray, i) {
        document.getElementById("city_name").textContent = town.alt;
        document.getElementById("city_region").textContent = coordinatesArray[i][3];
    }

    counter() {
        this.cityCount++;
    }
}

class UserSheet {
    constructor(routesData) {
        this.wallet = 100;
        this.walletDisplay = document.getElementById('user_wallet');
        this.cart = [];
        this.cityPrices = {};
        this.currentCity = null;
        this.routesData = routesData;
        this.pathLength;
    }

    createWallet() {
        this.walletDisplay.innerHTML = "Wallet: " + this.wallet.toFixed(2);
    }
    
    takeTransaction(buttonId, cityGoods, currentCity) {
        let productId = buttonId.split('_')[1];
        let quantityElement = document.getElementById(`quantity_${productId}`);
        let quantity = Number(quantityElement.value);
    
        if (!isNaN(quantity) && quantity > 0 && this.countDecimals(quantity) <= 2 && this.wallet >= cityGoods[productId][2]*quantity) {
            this.wallet -= cityGoods[productId][2]*quantity;
            let productInCart = this.cart.find(item => item[0] === cityGoods[productId][0]);
            if (productInCart) {
                productInCart[7] += quantity;
                let qualityIncrease = (quantity * ((productInCart[6] / 100) * productInCart[5])) / 10;
                productInCart[6] = Math.min(100, productInCart[6] + qualityIncrease);
            } else {
                let productWithQuantity = [...cityGoods[productId], quantity];
                this.cart.push(productWithQuantity);
            }
            this.fillUserSheet(currentCity, false);
        }
    }    

    fillUserSheet(currentCity, reajust) {
        this.createWallet(currentCity)

        const cartSpace = document.querySelector('.cart');
        cartSpace.innerHTML = '';
    
        this.cart.forEach((item, i) => {
            let price;
            if (reajust || typeof this.cityPrices[currentCity] === 'undefined' || !this.cityPrices[currentCity].hasOwnProperty(item[1])) {
                price = this.calculateSellingPrices(item, currentCity);
                this.currentCity = currentCity;
            } else {
                let qualityDifference = Math.abs(item[6] - this.cityPrices[currentCity][item[1]].quality);
                let qualityReajust = (qualityDifference / 100) * this.cityPrices[currentCity][item[1]].price;
                price = this.cityPrices[currentCity][item[1]].price + (qualityReajust / 10);
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
            cartItemBot.innerHTML = `<p id="qt_${i}" class="qt">${item[7]}Qt</p><p class="item_quality">${item[6].toFixed(2)}%</p><input type="text" id="sellQuantity_${i}" name="quantity" placeholder="Quantity">`;
    
            const sellButton = document.createElement('button');
            sellButton.id = `sell_${i}`;
            sellButton.type = 'submit';
            sellButton.innerText = 'Sell';
            sellButton.addEventListener('click', () => this.sellGood(price, item[7], i, currentCity));
    
            cartItemBot.appendChild(sellButton);
            cartItemDiv.append(cartItemTop, cartItemBot);
            cartSpace.appendChild(cartItemDiv);
        });
    }

    countDecimals(value) {
        if (Number.isInteger(value)) return 0;
        return value.toString().split(".")[1]?.length || 0;
    }
    
    sellGood(price, availableQuantity, item, currentCity) {
        let soldQuantity = Number(document.getElementById(`sellQuantity_${item}`).value);
        const qt = document.getElementById(`qt_${item}`);
    
        if (soldQuantity <= availableQuantity && soldQuantity > 0 && !isNaN(soldQuantity) && this.countDecimals(soldQuantity) <= 2) {
            this.wallet += price * soldQuantity;
            if (soldQuantity === availableQuantity || availableQuantity <= 0) {
                this.cart.splice(item, 1);
                this.fillUserSheet(currentCity);
            } else {
                this.cart[item][7] -= soldQuantity;
                qt.innerHTML = this.cart[item][7]+'Qt';
            }
            this.createWallet(currentCity);
        }
    }    

    calculateTravelledDistance(currentCityId, nextCityId) {
        if (this.cart.length > 0) {
            this.routesData.forEach((route) => {
                if ((route[0][0][1].toString() === currentCityId || route[0][1][1].toString() === currentCityId) && 
                    (route[0][0][1].toString() === nextCityId || route[0][1][1].toString() === nextCityId)) {
                    this.pathLength = route[1]
                }
            });
            for (let item of this.cart) {
                if (!item[8]) {
                    item.push(this.pathLength);
                } else {
                    item[8] += this.pathLength;
                }
            }
        }
    }    
    
    calculateItemQuality(item) {
        if (item[8]) {
            var decrementFactor = ((item[5]/10) + ((item[7] * 0.5) / 1000) + 1);
            item[6] = item[6] / decrementFactor;
            item[6] = Math.max(0, item[6]);
    
            if (item[6] < 20) {
                item[6] = item[6] * item[5];
            }
        }
    }
    
    calculateSellingPrices(item, currentCity) {
        this.calculateItemQuality(item);
    
        const randomValue = Math.random() / 10;
        let adjustmentFactor = item[4].includes(Number(currentCity[0])) ? 1 - randomValue : 1 + randomValue;
        adjustmentFactor = Math.max(0.65, Math.min(1.5, adjustmentFactor));
    
        if (!this.cityPrices[currentCity]) {
            this.cityPrices[currentCity] = {};
        }
        if (!this.cityPrices[currentCity][item[1]]) {
            this.cityPrices[currentCity][item[1]] = {price: item[2], count: 0, quality: item[6]};
        }
        
        let price = (item[2] * adjustmentFactor) * (item[6] / 100);
        if (this.cityPrices[currentCity][item[1]].count > 0) {
            price *= Math.max(0.90, Math.min(1.20, adjustmentFactor));
        }
    
        this.cityPrices[currentCity][item[1]].price = price;
        this.cityPrices[currentCity][item[1]].count += 1;
    
        return price;
    }    
}

window.onload = async function() {
    const fetcher = new JsonFetcher("data.json");

    try {
        const data = await fetcher.fetchData();

        const userSheet = new UserSheet(data.routesLength);
        userSheet.createWallet(null);

        const citySheet = new CitySheetBuilder(data.products, userSheet);
        var [citySize, marketSize] = citySheet.scaleCity(data.connections);

        const city = new CityHandler(citySheet, userSheet);
        city.createCities(data.connections, data.coordinatesArray)

        city.createSvg();
        city.drawLines(data.measures);

        initDragElement();
        initResizeElement();
        const stringRoutesLength = JSON.stringify(data.routesLength);
        localStorage.setItem('routesLengthString', stringRoutesLength);
    } catch (error) {
        console.error("Not going well:", error);
    }
}
var zoom = new ZoomInMap();
zoom.activateZoom();
zoom.activateDrag();

//loading
window.addEventListener('load', function() {
    document.getElementById('loading').style.display = 'none';
    document.querySelector('body').style.overflow = 'auto';
});


//send the travel log
const dataPage = document.getElementById('data-page');
dataPage.addEventListener('click', () => {
    const stringTravelLog = JSON.stringify(travelLog);
    localStorage.setItem('travelLogString', stringTravelLog);
});

//get map coordinates
/*var allCoordinates = [];
window.getCoordinates = function(event) {
    var iconsDiv = document.getElementById("icons");
    var rect = iconsDiv.getBoundingClientRect();
    var x = ((event.clientX - rect.left) / rect.width) * 100;
    var y = ((event.clientY - rect.top) / rect.height) * 100;
    var coordinates = "ARRAY[" + x.toFixed(2) + ", " + y.toFixed(2) + "],";
    allCoordinates.push(coordinates);
    
    document.getElementById("coordinates").innerHTML = allCoordinates.join('<br>');
}    */