/**
 * Based on Google Custom Elements documentation:
 * https://developers.google.com/web/fundamentals/web-components/customelements
 */

// Defines the custom element's class
class NotFound extends HTMLElement {

    // Defines what should be done when the element is attached to the DOM
    connectedCallback () {
        // Sets the element's inner HTML to its own render() method's
        this.innerHTML = this.render()
    }

    // Defines the component default inner HTML
    render () {
        return `
            <h2>Not found</h2>
            <p>This page doesn't seem to be a part of this app.</p>
            <br/>
            <a href="#">Back to home</a>
        `
    }
}

// Defines the custom element tag so it can be used in DOM
window.customElements.define('not-found', NotFound)