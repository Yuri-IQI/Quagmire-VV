# Quagmire
[![en](https://img.shields.io/badge/lang-en-red.svg)](README.md)

Quagmire é um jogo de navegador sobre comércio de produtos entre cidades em um mundo fictício.
Além da página de jogo, o site também conta com uma página de visualização de dados para ver suas interações com o mundo através de gráficos.

## Acesso Online
Atualmente, o site está online no GitHub Pages, e pode ser acessado [Aqui](https://yuri-crt.github.io/Quagmire-VV/).

Observações:

    A página pode levar alguns segundos para carregar.
    O site foi desenvolvido e testado principalmente no navegador Firefox para computador.
    Pequenos problemas de compatibilidade podem ocorrer em outros navegadores.

## Execução Local
Primeiramente, use este comando para clonar o repositório:

```
gh repo clone Yuri-crt/Quagmire-VV
```

Para executar a versão do branch main, que necessita do backend, é preciso instalar o Flask para o Python:

```
pip install flask
```

Depois, execute o arquivo mire.py e então o index.html.

Para executar o branch stand-alone-front, apenas clone o repositório.

## Por Que Isso Existe?
Quagmire foi criado como parte de um passatempo de worldbuilding e do meu interesse em aprender e me desenvolver como profissional de web. O projeto me motiva a explorar novas facetas do desenvolvimento de software, adquirindo novas habilidades enquanto crio algo que considero divertido e gratificante.

## Interações

Navegação

    Clique nos ícones das cidades para acessar seus mercados e se mover de uma cidade para outra.

Comprar

    Na folha da cidade, selecione a quantidade de um produto na seção de mercado e clique no botão "Buy".

Vender

    Na folha do usuário, selecione a quantidade de um produto comprado no carrinho e clique no botão "Sell".

Visualizar Dados

    Clique no botão "View Data" no canto superior esquerdo para acessar a página de visualização de dados.

Interação com Folhas

    Arrastar Folha: Segure a tecla "Shift" e clique na parte superior de qualquer folha para arrastá-lo.
    Redimensionar: Segure a tecla "R" e clique no canto inferior ou direito de qualquer folha para redimensioná-lo.

Modo de Zoom

    Clique no nome de uma região da cidade (por exemplo, Siourin) para entrar no modo de zoom. Clique no nome novamente para usar o modo normal.

Visualização de Gráficos

    Seleção de Gráficos: Na página de gráficos, clique em um dos gráficos para vê-lo em tela cheia.
    Seleção de Conjunto de Dados: Na página de gráficos, clique no nome de um conjunto de dados para ocultá-lo do gráfico.
