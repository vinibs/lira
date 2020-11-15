/**
 * Based on Google Custom Elements documentation:
 * https://developers.google.com/web/fundamentals/web-components/customelements
 */
import '../components/links.js'
import { http } from '../../../js/lira.js'

// Defines the custom element's class
class ParamPage extends HTMLElement {

    // Defines what should be done when the element is attached to the DOM
    connectedCallback () {
        // Sets the element's inner HTML to its own render() method's
        this.innerHTML = this.render()
    }

    // Defines the component default inner HTML
    render () {
        let paramCode = ''
        for (let i in http.params) {
            paramCode += `<li>${i}: ${http.params[i]}</li>`
        }

        return `
            <h2>Parameters</h2>
            Found parameters in current URL:
            <ul style="max-width:120px; margin:5px auto 25px; padding:0">
                ${paramCode}
            </ul>
            <app-links></app-links>
        `
    }
}

// Defines the custom element tag so it can be used in DOM
window.customElements.define('param-page', ParamPage)