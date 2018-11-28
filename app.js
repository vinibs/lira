var Core = (function(router) {
    //console.log('instanciando novo Core');
    this.router = router;
    var basepath = router.basepath;
    var clearpath = router.clearpath;

    this.pageContents = []; // Armazena o conteúdo das páginas já carregadas

    // Verifica o conteúdo da página, se já foi carregado
    this.checkPageContent = function(pageUrl){
        for(var i = 0; i < this.pageContents.length; i++){
            if(this.pageContents[i].url === pageUrl){
                return true;
            }
        }
        return false;
    };

    this.adjustLinks = function() {
        var links = document.getElementsByTagName("a");
        var imgs = document.getElementsByTagName("images");

        // Substitui as ocorrências de "/" por "\/" (escapando os caracteres) e
        // verifica se inicia com "http://" ou "//". Verifica se o caminho base
        // não é a raiz do servidor (ou seja, string vazia).
        var regexText = '';
        if(this.router.clearpath !== ''){
            regexText += "(("+this.router.clearpath.replace(/\//g, "\\\/")+").*)|";
        }
        regexText += "((http:\\/\\/).*)|((\\/\\/).*)";

        // Cria um objeto regex para poder fazer as comparações
        var regex = new RegExp(regexText);
        for(var i = 0; i < links.length; i++){
            // Corrige possíveis referências quebradas
            if(!regex.test(links[i].getAttribute("href"))){
                var url = links[i].getAttribute("href");

                url = this.adjustUrl(url);
                links[i].setAttribute("href", url);
                this.router.setLink(links[i]);
            }
        }

        // Substitui os src das imagens
        for(i = 0; i < imgs.length; i++){
            if(!regex.test(imgs[i].getAttribute("src"))){
                var src = imgs[i].getAttribute("src");
                imgs[i].setAttribute("src", this.router.clearpath+"/"+src);
            }
        }
    };

    // Ajusta uma URL relativa para ser relativa à raiz do projeto
    this.adjustUrl = function (url) {
        // Substitui as ocorrências de "/" por "\/" (escapando os caracteres) e
        // verifica se inicia com "http://" ou "//"
        var regexText = "(("+this.router.clearpath.replace(/\//g, "\\\/")+").*)|((http:\\/\\/).*)|((\\/\\/).*)";

        // Cria um objeto regex para poder fazer as comparações
        var regex = new RegExp(regexText);

        // Corrige possíveis referências quebradas
        if(!regex.test(url)){

            // Substitui referência a "/" por "", para evitar links terminados em "//"
            if(url === "/"){
                url = "";
            }

            // Substitui a "/" inicial para evitar ocorrência de "//"
            if(url[0] === "/"){
                url = url.substr(1);
            }

            url = this.router.clearpath+"/"+url;
        }

        return url;
    };

    this.adjustRefs = function() {
        // Obter todos os elementos que podem usar referências quebradas e os substitui
        var styles = document.getElementsByTagName("link");
        var scripts = document.getElementsByTagName("script");

        // Substitui as ocorrências de "/" por "\/" (escapando os caracteres) e verifica se inicia com "http://" ou "//"
        var regexText = "(("+this.router.clearpath.replace(/\//g, "\\\/")+").*)|((http:\\/\\/).*)|((\\/\\/).*)";

        // Cria um objeto regex para poder fazer as comparações
        var regex = new RegExp(regexText);

        // Substitui os estilos na index
        for(var i = 0; i < styles.length; i++){
            if(!regex.test(styles[i].getAttribute("href"))){
                var href = styles[i].getAttribute("href");
                styles[i].setAttribute("href", this.adjustUrl(href));
            }
        }

        // Substitui os scripts na index
        for(i = 0; i < scripts.length; i++){
            if(!regex.test(scripts[i].getAttribute("src"))){
                var parent = scripts[i].parentNode;
                var src = scripts[i].getAttribute("src");
                scripts[i].setAttribute("src", this.adjustUrl(src));

                var newScript = document.createElement("script");
                newScript.setAttribute("src", this.router.clearpath+"/"+src);
                newScript.setAttribute("tyle", scripts[i].getAttribute("type"));
                parent.replaceChild(newScript, scripts[i]);
            }
        }
    };

    // Converte um caminho relativo em um caminho absoluto, com referência ao caminho base passado
    this.toAbsolutePath = function(base, relative) {
        // Remove uma possível barra no início da url relativa
        if(relative.charAt(0) === "/"){
            relative = relative.substring(1);
        }

        // Divide os caminhos pelas barras "/"
        var stack = base.split("/");
        var parts = relative.split("/");
        stack.pop(); // Remove o nome do arquivo atual (ou uma string vazia)

        // Verifica cada parte do caminho relativo e monta o vetor do caminho absoluto
        for (var i = 0; i < parts.length; i++) {
            if (parts[i] === ".")
                continue;
            if (parts[i] === "..")
                stack.pop();
            else
                stack.push(parts[i]);
        }

        return stack.join("/");
    };


    // Importa um dado arquivo no servidor por meio de requisição HTTP
    this.importFile = function(file, callback){
        file = file.charAt(file.length-1) === "/" ? file.substring(0, file.length-1) : file;
        //console.log('importando arquivo '+file);
        var core = this;

        if(this.checkPageContent(file)){
            //console.log('usar o conteúdo já armazenado da página');

            var pageObject = {};

            // Obter o item e criar um objeto simulando o XHR com as propriedades salvas
            for(var i = 0; i < this.pageContents.length; i++){
                if(file === this.pageContents[i].url){
                    pageObject = {response: this.pageContents[i].content, responseUrl: this.pageContents[i].url};
                    break;
                }
            }

            // Executar o callback
            callback(pageObject);

        } else {
            //console.log('importar o arquivo da página');

            var xhr = new XMLHttpRequest();
            xhr.open("GET", file, true);
            xhr.send();

            // Espera a requisição do xhr (será?)
            var timer = setInterval(function () {
                if (xhr.response !== "") {

                    // Tentar evitar carregar duas vezes o mesmo conteúdo, quando repetido na página
                    if(!core.checkPageContent(file)){
                        core.pageContents.push({
                            url: file,
                            content: xhr.response
                        });
                    }

                    //console.log("função interna: " + file);
                    callback(xhr);
                    clearInterval(timer);
                }
            }, 20);

        }
    };

    // Importa e executa um arquivo JS e suas dependências para uma dada página, definida pela rota
    this.importAndExec = function(routeData, getVars) {
        //console.log('funçao de importar e executar');

        var core = this;
        var router = this.router;

        // Variável que define se o arquivo CSS da página foi inserido no carregamento atual
        var cssInsertedNow = false;

        var fileFolder = router.basepath+"/src/app/pages/";
        routeData.setup = routeData.setup.charAt(0) !== "/" ? routeData.setup : routeData.setup.substring(1);


        // Identifica os arquivos de páginas por '.page.js'
        var filePath = fileFolder+routeData.setup+".page.js";
        getVars = (typeof getVars !== "undefined") ? getVars : "";
        //
        // // Remove o JS de outra página caso exista
        // var pageScript = document.getElementById("page-script");
        // if(pageScript !== null) {
        //     routeContent.removeChild(pageScript);
        // }

        // Importa dinamicamente o arquivo com a página e executa a ação definida nele
        window.page = null;
        var script = document.createElement("script");
        script.src = filePath;
        script.id = "page-script";
        document.getElementById("scripts-section").appendChild(script);


        // Espera carregar o conteúdo do arquivo JS e executa a inserção dos demais arquivos
        var interval = setInterval(function() {

            // Se estiver carregado, executa
            if(page !== null){
                router.loadTemplate(page.template, function() {
                    var scriptObj = script;
                    var interval2 = setInterval(function(){
                        if(document.getElementById('route-content') !== null) {
                            var routeContent = document.getElementById('route-content');

                            // Remove o JS de outra página caso exista
                            var pageScript = document.getElementById('page-script');
                            if (pageScript !== null) {
                                document.getElementById("scripts-section").removeChild(pageScript);
                            }

                            // Adiciona o script da página à seção de
                            document.getElementById("scripts-section").appendChild(scriptObj);

                            // Adiciona chamada para o JS global
                            var globalscript = document.getElementById('globalScript');
                            if (globalscript === null) {
                                var script = document.createElement('script');
                                script.id = "globalScript";
                                script.src = router.basepath + "/src/app/app.globalscripts.js";
                                document.body.appendChild(script);
                            }

                            // Remove estilos que possam ter sido incluídos na página anterior
                            var prevStyles = document.getElementsByClassName("dynamicStyle");
                            for (i = 0; i < prevStyles.length; i++) {
                                prevStyles[i].setAttribute('class', 'dynamicStyle old');
                            }


                            // Altera o título da página, caso seja definido; senão, define o título definido na index
                            if (typeof page.title !== "undefined") {
                                document.title = page.title;
                            } else {
                                document.title = core.pageContents[0].title;
                            }


                            // Se prepara para importar o HTML e CSS
                            // Trabalha com os caminhos recebidos para obter o caminho dos arquivos
                            if (routeData.setup.charAt(0) === "/") {
                                routeData.setup = routeData.setup.substring(1);
                            }
                            var pathArray = routeData.setup.split("/");
                            pathArray[pathArray.length - 1] = "";

                            // Obtém o caminho completo até os arquivos HTML e CSS
                            var htmlFolder = fileFolder + pathArray.join("/");


                            // Importa o conteúdo HTML da página, caso haja
                            if (typeof page.pageFile !== "undefined") {
                                var htmlPath = core.toAbsolutePath(htmlFolder, page.pageFile);
                                core.importFile(htmlPath, function (pageContent) {
                                    if (pageContent.response !== "") {

                                        // Importa o HTML para a página, se houver
                                        if (pageContent.response !== core.pageContents[0].content) {
                                            // Espera pelo carregamento do CSS, caso haja, para só então carregar o HTML
                                            if (typeof page.styleFile !== "undefined") {
                                                var i1 = setInterval(function () {
                                                    var style = document.getElementsByClassName("dynamicStyle");
                                                    if (style.length > 0) {
                                                        routeContent.innerHTML = pageContent.response;
                                                        clearInterval(i1);
                                                    }
                                                }, 20);
                                            } else {
                                                routeContent.innerHTML = pageContent.response;
                                            }

                                            // Volta ao topo da página apóes carregar o conteúdo
                                            window.scrollTo(0, 0);

                                            // Remove o ícone de "loading"
                                            var loading = document.getElementById("loading-marker")
                                            if (loading !== undefined)
                                                loading.removeAttribute("style");

                                            //console.log('HTML inserido')
                                        }


                                        // Verifica se há links na página e espera até que sejam carregados para ajustá-los
                                        var regexLink = new RegExp(/<a.*>.*<\/a>/g);
                                        if (regexLink.test(pageContent.response)) {
                                            // Aguarda o carregamento dos links
                                            var i3 = setInterval(function () {
                                                var links = document.getElementsByTagName("a");
                                                if (links.length > 0) {

                                                    // Ajusta os links para evitar links quebrados
                                                    core.adjustLinks();

                                                    clearInterval(i3);
                                                }
                                            }, 20);
                                        }
                                    }

                                });
                            }


                            // Importa o conteúdo CSS da página, caso haja
                            if (typeof page.styleFile !== "undefined") {
                                var cssPath = core.toAbsolutePath(htmlFolder, page.styleFile);

                                // Importa o CSS, se houver
                                core.importFile(cssPath, function (styleContent) {
                                    if (styleContent.response !== core.pageContents[0].content && !cssInsertedNow) {
                                        var style = document.createElement("link");
                                        style.type = "text/css";
                                        style.href = cssPath;
                                        style.rel = "stylesheet";
                                        style.className = "dynamicStyle";
                                        document.head.appendChild(style);

                                        // Define que o CSS foi inserido no carregamento autal
                                        // (que não é vestígio da página anterior)
                                        cssInsertedNow = true;
                                        //console.log('CSS inserido');


                                        // Remove os estilos antigos, de outra página
                                        prevStyles = document.getElementsByClassName("dynamicStyle old");

                                        for (i = 0; i < prevStyles.length; i++) {
                                            document.head.removeChild(prevStyles[i]);
                                        }
                                    }
                                });

                            } else {
                                // Remove os estilos da página anterior e não adiciona nada
                                for (i = 0; i < prevStyles.length; i++) {
                                    document.head.removeChild(prevStyles[i]);
                                }
                            }


                            // Executa a ação JS da página, caso seja definida
                            if (typeof page.handler !== "undefined") {
                                // Dá um intervalo de tempo para carregar a variável, caso seja passada
                                setTimeout(function () {
                                    // Espera pelo carregamento do HTML, caso haja, para só então executar a ação
                                    if (typeof page.pageFile !== "undefined") {
                                        var i = 1;
                                        var i2 = setInterval(function () {
                                            if (routeContent !== "") {
                                                page.handler(getVars);
                                                clearInterval(i2);
                                                i++;
                                            }
                                        }, 20);
                                    } else {
                                        page.handler(getVars);
                                    }
                                }, 20);
                            }
                        }

                        clearInterval(interval2);
                    }, 20);
                });

                clearInterval(interval);
            }
        }, 20);

    };
});


var Router = (function() {
    //console.log('instanciando novo Router');
    this.core = new Core(this);

    // Define o template principal como sendo o default inicialmente
    this.currentTemplate = null;

    // Obtém o caminho da raiz do servidor
    this.getRootPath = function() {
        return location.protocol + "//"+ location.host + "/";
    };

    // Obtém a url exceto o caminho base do projeto (basepath)
    this.getExtraPath = function() {
        // Obtém o caminho da raiz, os demais elementos da URL e os une
        var rootPath = this.getRootPath();
        var relativePath = document.location.pathname.substring(1);

        var extraPath = (rootPath + relativePath).substring(this.basepath.length);
        var firstChar = extraPath.substring(0, 1);

        // Remove a barra no início do trecho da url, caso necessário
        if(firstChar === "/"){
            extraPath = extraPath.substring(1);
        }

        return extraPath;
    };

    // Obtém o caminho base do projeto (basepath)
    this.getBasePath = function() {
        /* Define a url do servidor, obtém o caminho da app pela configuração e
         * obtém seu primeiro e seu último caracteres
         */
        var appPath = document.getElementsByTagName("base")[0].href;
        var firstChar = appPath.substring(0, 1);
        var lastChar = appPath.substring(appPath.length-1);

        // Remove a "/" no início da url, se houver
        if(firstChar === "/"){
            appPath = appPath.substring(1);
        }

        // Remove a "/" no fim da url, se houver
        if(lastChar === "/"){
            appPath = appPath.substring(0, appPath.length-1);
        }

        // Retorna a url do servidor incluindo a pasta raiz da aplicação
        return appPath;
    };

    // Obtém o caminho relativo da base da aplicação limpa
    this.getClearRelativePath = function() {
        var relativeAppPath = document.getElementsByTagName("base")[0].getAttribute("href");
        var firstChar = relativeAppPath.substring(0, 1);
        var lastChar = relativeAppPath.substring(relativeAppPath.length-1);

        // Remove a "/" no início da url, se houver
        if(firstChar !== "/"){
            relativeAppPath = "/"+relativeAppPath.substring(1);
        }

        // Remove a "/" no fim da url, se houver
        if(lastChar === "/"){
            relativeAppPath = relativeAppPath.substring(0, relativeAppPath.length-1);
        }

        return relativeAppPath;
    };


    // Caminhos base
    this.basepath = this.getBasePath();
    this.clearpath = this.getClearRelativePath();


    // Adiciona um listener para fazer o redirecionamento interno
    this.setLink = function(link) {
        var router = this;
        var url = link.getAttribute("href");

        var target = link.getAttribute("target");
        var sameWindow = (target === null || target === "_self" || target === "self");

        // console.log(this.checkHasRoute(url));
        link.onclick = function(e){
            // Se o arquivo recebido for a index (redirecionada pelo servidor) e não tiver um target
            // diferente (uma nova aba/janela, por exemplo), executa o roteamento
            if(sameWindow) {
                // Evita que o link faça uma requisição nova e executa o link internamente
                e.preventDefault();

                // Executa o código definido em um possível "onclick" antes de redirecionar
                if(link.getAttribute("onclick") !== null){
                    var execCode = new Function(link.getAttribute("onclick"));
                    execCode.apply(this);
                }

                if (typeof(showLoading) === typeof(Function))
                    showLoading();

                var obj = {Title: "", Url: url};
                history.pushState(obj, obj.Title, obj.Url);
                router.execute();
            }
        };
    };

    // Inicia/executa o roteamento
    this.execute = function() {
        //console.log('executando roteamento');
        var path = this.getExtraPath();
        // Registra o template
        var template = null;
        // Verifica todas as rotas
        for (var i = 0; i < routes.length; i++){
            // console.log(routes[i].path);
            if((path === "" && (routes[i].path === "" || routes[i].path === "/")) || // Página inicial
                path === routes[i].path) // Qualquer outra página
            {
                //console.log('importar o arquivo da página');

                // Executa a importação, caso haja uma rota
                this.core.importAndExec(routes[i]);
                return;
            }
            // Verifica se existe alguma rota com parâmetros que corresponda à URL atual.
            // Sempre executará a primeira rota correspondente encontrada
            else
            {
                var clearRoute = "";
                var clearUrl = "";

                // Remove a "/" ao final da rota
                if(routes[i].path.charAt(routes[i].path.length-1) === "/"){
                    clearRoute = routes[i].path.substring(0, routes[i].path.length-1);
                } else {
                    clearRoute = routes[i].path;
                }

                // Remove a "/" ao início da rota
                if(routes[i].path.charAt(0) === "/"){
                    clearRoute = clearRoute.substring(1);
                } else {
                    clearRoute = clearRoute;
                }

                // Remove a "/" ao final da url
                if(path.charAt(path.length-1) === "/"){
                    clearUrl = path.substring(0, path.length-1);
                } else {
                    clearUrl = path;


                }// Remove a "/" ao início da url
                if(path.charAt(0) === "/"){
                    clearUrl = clearUrl.substring(1);
                }

                // Divide a rota e a url nas barras, transformando-os em vetor
                var splitRoute = clearRoute.split("/");
                var splitPath = clearUrl.split("/");

                // Verifica se há o mesmo número de componentes na rota e na url
                if(splitPath.length === splitRoute.length) {
                    for (var j = 0; j < splitPath.length; j++) {
                        // Verifica se cada posição da URL é igual à mesma posição da rota
                        // ou se na rota há espaço para uma variável nesta posição ("{[nome]}")
                        if (splitPath[j] === splitRoute[j] || (/{.+}/g).test(splitRoute[j])) {

                            // Se for o último parâmetro e estiver OK, executa a função com parâmetros
                            // (identificados por "{[nome]}" na rota)
                            if (j === splitPath.length - 1) {
                                var vars = [];
                                // Roda a rota toda para armazenar os valores das variáveis
                                for (var k = 0; k < splitRoute.length; k++) {
                                    // Caso seja variável na rota, adiciona ao vetor usando o nome descrito
                                    // na própria rota
                                    if ((/{.+}/g).test(splitRoute[k])) {
                                        var param = (/({.+})/g).exec(splitRoute[k])[0];
                                        var varName = param.replace(/[{}]/g, "");
                                        // Adiciona ao vetor um objeto com o nome e o valor do parâmetro
                                        vars.push({name: varName, content: splitPath[k]});
                                    }
                                }

                                var getVars = {};
                                // Orgniza os parâmetros em um objeto, com base em seu nome e valor
                                for (k = 0; k < vars.length; k++) {
                                    getVars[vars[k].name] = vars[k].content;
                                }

                                // Executa a função definida no arquivo JS e passa as variáveis
                                this.core.importAndExec(routes[i], getVars);
                                return;
                            }
                        } else {
                            // Continua a execução para comparar a verificação da rota
                            break;
                        }
                    }
                }

                // Rota "*", para erro 404 personalizado
                if(clearRoute.trim() === "*"){
                    var core = this.core;
                    var route = routes[i];

                    // Verifica se o conteúdo da página desconhecida bate com a index para saber se é interna ou não
                    this.core.importFile(path, function(pageContent){

                        // Se for uma página interna, roteia
                        if(pageContent.response === core.pageContents[0].content){
                            core.importAndExec(route);
                        }
                        // Se for externa, redireciona
                        else {
                            window.location.replace(path);
                        }
                    });
                    return;
                }
            }
        }


        // Não encontrou nenhuma rota até aqui e já passou por todas as rotas
        var router = this;
        var route = routes[i];

        // Verifica se o conteúdo da página desconhecida bate com a index para saber se é interna ou não
        this.core.importFile(path, function(pageContent){

            // Se for uma página interna, exibe a pagina de 404 padrão
            if(pageContent.response === router.core.pageContents[0].content){
                // Remove estilos que possam ter sido incluídos na página anterior
                var prevStyles = document.getElementsByClassName("dynamicStyle");
                for(i = 0; i < prevStyles.length; i++){
                    document.head.removeChild(prevStyles[i]);
                }


                // Remove scripts que possam ter sido incluídos na página anterior
                var prevScript = document.getElementById("page-script");
                if(prevScript !== null){
                    // noinspection Annotator
                    document.getElementById("scripts-section").removeChild(prevSript);
                }

                // Área de conteúdo
                var routeContent = document.getElementById("route-content");

                routeContent.innerHTML = "<h1>Page not found </h1>";
                routeContent.innerHTML += "<h4>(HTTP 404)</h4>";
                var linkHome = document.createElement("a");
                var linkText = document.createTextNode("Go back to home");
                linkHome.setAttribute("href", router.basepath);
                linkHome.appendChild(linkText);
                routeContent.appendChild(linkHome);

                router.setLink(linkHome);
            }
            // Se for externa, redireciona
            else {
                window.location.replace(path);
            }
        });
    };


    // Carrega um template
    this.loadTemplate = function(templateName, callback)
    {

        templateName = (templateName === undefined || templateName === null || templateName === '') ?
            'default' : templateName;

        var router = this;
        if (this.currentTemplate !== templateName) {
            // Importa o template e chama o callback
            this.core.importFile('src/app/views/'+templateName+'.view.html', function(data) {
                // Carrega o conteúdo do template
                document.getElementById("content-section").innerHTML = data.response;

                // Define o template atual como sendo o novo template a ser carregado
                this.currentTemplate = templateName;
            });
        }
        // Senão, não faz nada e usa o mesmo


        var interval = setInterval(function () {

            // Quando tiver carregado o template
            if (document.getElementById('route-content') !== null) {
                (callback !== undefined && callback !== null && callback !== '') ? callback(router) : '';
                clearInterval(interval);
            }
        }, 10);
    }
});




var App = (function() {
    //console.log('instanciando novo App');
    // Variável que define se o app já foi iniciado, para evitar o processo de iniciação mais de uma vez
    var started = false;
    var router = new Router();
    var core = router.core;

    /**
     * @type {Array} data - Global array to be used as a way to keep data between multiple pages
     */
    this.data = [];


    var start = function(){
        started = true;
        //console.log('método app start()');

        // Insere o CSS principal antes de executar o roteamento, caso já não tenha sido inserido
        var css = document.getElementsByClassName("mainCss");
        if (css.length === 0) {
            var appPath = router.clearpath;
            // var appPath = '/spa2/';
            var mainCss = appPath + "/main.css";
            var link = document.createElement("link");
            link.type = "text/css";
            link.rel = "stylesheet";
            link.href = mainCss;
            link.className = "mainCss";
            document.head.appendChild(link);
            //console.log('importa CSS main');
        }

        // Importa o arquivo com as rotas para a head da página
        var routeScript = document.getElementById("route-list");
        if (routeScript === null) {
            var script = document.createElement("script");
            script.src = router.basepath + "/src/app/app.routes.js";
            script.setAttribute("id", "route-list");
            script.type = "text/javascript";
            document.getElementById("scripts-section").appendChild(script);
            //console.log('importa JS routes');
        }

        var interval = setInterval(function () {
            if (typeof routes !== "undefined") {
                // console.log('rotas carregadas');
                router.execute();
                core.adjustRefs();
                core.adjustLinks();
                clearInterval(interval);
            }
        }, 10);
    };


    /**
     * @param {Object} ajaxObj - Ajax object
     * @param {string} ajaxObj.url - URL target
     * @param {array} ajaxObj.headers - Array with request's headers
     * @param {Object} ajaxObj.data - Data to be sent with the request
     * @param {Object} ajaxObj.ContentType - Data mime type of the request's data
     * @param {function(data):void} ajaxObj.success - Function to be executed on request's success
     * @param {function(data):void} ajaxObj.beforeSend - Function to be executed before the request
     * @param {function(data):void} [ajaxObj.fail] - Function to be executed on request's fail
     * @param {string} [ajaxObj.method] - HTTP Request method
     * @param {boolean} [ajaxObj.async] - Asyncronous option
     *
     * Realiza uma requisição HTTP, utilizando alguns parâmetros passados pelo objeto dado à função
     */
    this.ajax = function(ajaxObj){
        ajaxObj.method = (typeof ajaxObj.method !== "undefined")? ajaxObj.method : "GET";
        ajaxObj.async = (typeof ajaxObj.async !== "undefined")? ajaxObj.async : true;
        ajaxObj.url = (typeof ajaxObj.url !== "undefined")? core.adjustUrl(ajaxObj.url) : "";
        ajaxObj.data = (typeof ajaxObj.data !== "undefined")? ajaxObj.data : "";
        ajaxObj.contentType = (typeof ajaxObj.contentType !== "undefined")? ajaxObj.contentType : "application/json";
        ajaxObj.headers = (typeof ajaxObj.headers !== "undefined")? ajaxObj.headers : "";
        ajaxObj.beforeSend = (typeof ajaxObj.beforeSend !== "undefined")? ajaxObj.beforeSend : null;
        ajaxObj.success = (typeof ajaxObj.success !== "undefined")? ajaxObj.success : null;
        ajaxObj.fail = (typeof ajaxObj.fail !== "undefined")? ajaxObj.fail : null;

        // Executa a função antes da requisição
        if(ajaxObj.beforeSend !== null)
            ajaxObj.beforeSend();

        var xhr = new XMLHttpRequest();
        xhr.open(ajaxObj.method, ajaxObj.url, ajaxObj.async);

        // Define o mimetype da requisição
        xhr.setRequestHeader('Content-Type', ajaxObj.contentType+'; charset=utf-8');

        // Serializa objetos caso o tipo de conteúdo seja JSON
        if(ajaxObj.contentType === 'application/json')
            ajaxObj.data = JSON.stringify(ajaxObj.data);

        // Adiciona os cabeçalhos à requisição
        if(ajaxObj.headers !== '') {
            var keys = Object.keys(ajaxObj.headers);
            for(var i = 0; i < keys.length; i++){
                xhr.setRequestHeader(keys[i], ajaxObj.headers[keys[i]]);
            }
        }

        xhr.send(ajaxObj.data);

        // Espera a requisição do xhr (será?)
        var timer = setInterval(function () {
            if (xhr.status !== 0) {

                // Executa a função do objeto com base na resposta do servidor
                if (xhr.status >= 200 && xhr.status < 300) {
                    if (ajaxObj.success !== null) {
                        ajaxObj.success(xhr);
                    }
                } else {
                    if (ajaxObj.fail !== null) {
                        ajaxObj.fail(xhr);
                    }
                }
                clearInterval(timer);
            }
        }, 20);
    };


    /**
     * @param {string} url - URL to setLink the user
     *
     * Redireciona automaticamente o usuário para uma dada rota
     */
    this.redirect = function(url) {
        // Redireciona url '/' para a raiz do projeto
        if(url === "" || url === "/"){
            url = router.basepath;
        }

        var obj = {Title: "", Url: url};
        history.pushState(obj, obj.Title, obj.Url);
        router.execute();
    };


    window.onpopstate = function() {
        //console.log('voltando a página');
        return start();
    };


    return core.importFile(router.clearpath, function(data) {
        //console.log('importando index pelo App');
        if(data.response.trim() !== '' && !started) {

            core.pageContents[0] = {
                url: router.clearpath,
                content: data.response,
                title: document.title,
                name: "base"
            };

            start();
        }
    });
});

function showLoading () {
    var loading = document.getElementById('loading-marker');
    loading.setAttribute('style', 'display: block');
}

// Quando a página é carregada
window.onload = function(){
    //console.log('onload');
    window.app = new App();
    //console.log(app);
};