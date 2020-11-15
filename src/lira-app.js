/**
 * Based on Google Custom Elements documentation:
 * https://developers.google.com/web/fundamentals/web-components/customelements
 */

// Defines the custom element's class
class LiraApp extends HTMLElement {

    // Defines what should be done when the element is attached to the DOM
    connectedCallback () {
        // Sets the element's inner HTML to its own render() method's
        this.innerHTML = this.render()
    }

    // Defines the component default inner HTML
    // The <route-contents> component is needed to render the contents
    // of each one of the routes defined for the app
    render () {
        return `
            <route-contents></route-contents>
        `
    }
}

// Defines the custom element tag so it can be used in DOM
window.customElements.define('lira-app', LiraApp)