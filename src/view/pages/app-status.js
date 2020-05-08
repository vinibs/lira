/**
 * Based on Google Custom Elements documentation:
 * https://developers.google.com/web/fundamentals/web-components/customelements
 */
import '../../components/links.js'
import { http } from '../../../js/lira.js'

// Defines the custom element's class
class AppStatus extends HTMLElement {
    constructor () {
        super()

        http.listenForAppMode('standalone', (e) => {
            // Re-renders if the media query changes
            this.innerHTML = this.render()
        })
    }

    // Defines what should be done when the element is attached to the DOM
    connectedCallback () {
        // Sets the element's inner HTML to its own render() method's
        this.innerHTML = this.render()
    }

    // Defines the component default inner HTML
    render () {
        return `
            <h2>App Status</h2>
            Current app status:
            <b style="text-transform: uppercase">
            ${http.appMode === 'standalone' ? 'Installed' : 'In browser'}
            </b>
            <br/><br/>
            <app-links></app-links>
        `
    }
}

// Defines the custom element tag so it can be used in DOM
window.customElements.define('app-status', AppStatus)