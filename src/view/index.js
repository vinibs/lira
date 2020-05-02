/**
 * Based on Google Custom Elements documentation:
 * https://developers.google.com/web/fundamentals/web-components/customelements
 */
import '../components/links.js'

// Defines the custom element's class
class AppIndex extends HTMLElement {

    // Defines what should be done when the element is attached to the DOM
    connectedCallback () {
        // Sets the element's inner HTML to its own render() method's
        this.innerHTML = this.render()
    }

    // Defines the component default inner HTML
    render () {
        return `
            <h2>Sou a home</h2>
            <app-links></app-links>
        `
    }
}

// Defines the custom element tag so it can be used in DOM
window.customElements.define('app-index', AppIndex)