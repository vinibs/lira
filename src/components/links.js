class AppLinks extends HTMLElement {
    connectedCallback () {
        this.innerHTML = this.render()
    }

    render () {
        return `
            <a href="#">home</a>
            <a href="#teste">teste</a>
            <a href="#teste/123">parâmetros</a>
            <a href="#josicleisson">non ecziste</a>
        `
    }
}

window.customElements.define('app-links', AppLinks)