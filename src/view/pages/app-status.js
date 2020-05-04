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

        // Initializes the app mode with request app mode
        this.appMode = http.appMode

        window.addEventListener('appinstalled', (e) => {
            // Changes current app mode when was just installed
            this.appMode = 'standalone'

            // Re-renders when the app installed event is triggered
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
            ${this.appMode === 'standalone' ? 'Installed' : 'In browser'}
            </b>
            <br/><br/>
            <app-links></app-links>
        `
    }
}

// Defines the custom element tag so it can be used in DOM
window.customElements.define('app-status', AppStatus)