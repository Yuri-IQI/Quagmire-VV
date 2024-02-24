# Quagmire
[![pt-br](https://img.shields.io/badge/lang-pt--br-green.svg)](README-pt-br.md)

This is Quagmire, a browser game about trading goods between cities in a fictional world through a map.
The game also contains a page with charts for visualizing some of the interactions with the world through data.

## Online Access
The site is currently online on GitHub Pages, to access it, [click here](https://yuri-crt.github.io/Quagmire-VV/).
The page might take a while to render, and the site was developed for the Firefox desktop browser, but it should work on other browsers as well.

## Run Locally
For running the site locally, first use this command for cloning the repository:

```
gh repo clone Yuri-crt/Quagmire-VV
```

Then, for running the main branch, which runs with the backend, it is necessary to install Flask for Python:

```
pip install flask
```

After that, just run mire.py and then launch the index.html.

For running the stand-alone-front locally, it should be enough to just clone the repository.

## Actions
Here is a list of actions that can be done in the game:

1. **Navigation**: Click on the city icons to access their markets and move from one city to another.
2. **Buy**: On the city sheet, select a quantity of a good in the market section, then click on the 'Buy' button.
3. **Sell**: On the user sheet, select a quantity of a bought good in the cart, then click on the 'Sell' button.
4. **Visualizing Data**: Click on the 'View Data' button in the top left corner to access the data viewing page.
5. **Drag Paper**: Hold 'Shift' and the top of any sheet to drag it.
6. **Resize**: Hold 'R' and the bottom or right corner of any sheet to resize it.
7. **Zoom Mode**: Click on a city region name (e.g., Siourin) to enter zoom mode, click the name again to use normal mode.
8. **Chart Selection**: On the charts page, click in one of the charts to see it in full screen.
9. **Dataset Selection**: On the charts page, click on a dataset name to stop showing it on the chart.
