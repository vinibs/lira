page = {
    title: 'Lira | Outra página',
    pageFile: 'other.page.html',
    handler: function(get) {
        document.getElementById('get').innerHTML = '</br>Variáveis GET:<br/>'+JSON.stringify(get);
        console.log(get);

        // Manipular as variáveis passadas pela URL
    }
};