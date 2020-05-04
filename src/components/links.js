class AppLinks extends HTMLElement {
    connectedCallback () {
        this.innerHTML = this.render()
    }

    render () {
        return `
            <a href="#">home</a>
            <a href="#func-route">function route</a>
            <a href="#parameterized/123">parameters</a>
            <a href="#app-status">PWA status</a>
            <a href="#notfoundpage">not found</a>
        `
    }
}

window.customElements.define('app-links', AppLinks)