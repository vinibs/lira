/**
 * @author Vinicius Baroni Soares
 * @version 1.0.0
 */

import config from '../src/config/config.js'

// Checks if the browser supports Custom Elements v1
if (!('customElements' in window))
    throw `Your browser is incompatible with this app`


/**
 * Router class, to do the app routing
 * @class Router
 */
class Router {
    /**
     * @constructor
     * @param {object} routeObj
     */
    constructor (routeObj) {
        // Listens to the hash change event
        window.addEventListener('hashchange', (ev) => {   
            this.run()
        })

        // Sets its Route() object, which contains the route list
        this.routeObj = routeObj
        this.run()
    }

    /**
     * Executes the route processing
     * @returns {any}
     */
    run () {
        let path = this.getPath()
        let notFoundRoute = null        
        
        // Check for a route that corresponds to current page
        for (const i in this.routeObj._routes) {
            let route = this.formatPath(this.routeObj._routes[i])

            // Check if the route corresponds to URL
            if (route.path === path) {
                return this.execRoute(route)
            }

            // Check if it is a wildcard route
            if (route.path === '*') {
                notFoundRoute = route
            }
        }

        // Check for a route with params for the current page
        for (const i in this.routeObj._routes) {
            let route = this.formatPath(this.routeObj._routes[i])

            // Test the syntax with regex
            let regex = `^${route.path.replace('*', '\\*')}$`
            .replace(/\//g, '\\/')
            .replace(/\{[A-z0-9-._]+\}/g, '[A-z0-9-_]+')

            if (new RegExp(regex).test(path)) {
                return this.execRoute(route)
            }
        }

        // No route was found
        if (notFoundRoute) {
            return this.execRoute(notFoundRoute)
        }

        throw `No route found for "${path}"`
    }

    /**
     * Formats the route path to start and end with a slash
     * @param {object} route 
     * @returns {object}
     */
    formatPath (route) {
        // Ignoring the wildcard path
        if (route.path !== '*') {
            // Adds a slash at the beginning if needed
            if (route.path.slice(0,1) !== '/') {
                route.path = `/${route.path}`
            }

            // Adds a slash at the end if needed
            if (route.path.slice(-1) !== '/') {
                route.path = `${route.path}/`
            }
        }

        return route
    }

    /**
     * Gets the URL path, formatting it to have a slash separating 
     * the hash from the content and to end with a slash
     * @returns {string}
     */
    getPath () {
        let path = '/'

        // Gets the current page based on the URL hash
        if (window.location.hash) {
            const currentHash = window.location.hash
            let slashedHash = window.location.hash

            // Separates the hash from the rest of URL with a slash
            if (currentHash.slice(1,2) !== '/') {
                slashedHash = slashedHash.replace('#', '#/')

                // Check if browser supports replaceState before change
                if (window.history && window.history.replaceState)
                    window.history.replaceState(null, null, slashedHash)
                else
                    return window.location.hash = slashedHash
            }

            // Adds a slash at the end of the URL
            if (currentHash.slice(-1) !== '/') {
                // Check if browser supports replaceState before change
                if (window.history && window.history.replaceState)
                    window.history.replaceState(null, null, `${slashedHash}/`)
                else
                    return window.location.hash = `${slashedHash}/`
            }

            path = window.location.hash.replace('#', '')
        }
        // Puts a slash at the end of the path for index, if it ends with a hash
        else if (window.location.href.slice(-1) === '#') {
            window.history.replaceState(null, null, `${window.location.href}/`)
        }

        return path
    }

    /**
     * Executes the route's component
     * @param {object} route 
     * @returns {any}
     */
    execRoute (route) {
        const type = typeof route.component
        const params = this.getUrlParams(route)
        let returnData = null
        // Sets the route's params in HTTP object
        http.params = params

        switch (type) {
            case 'function':
                // Try to execute as a usual function (not a class constructor)
                return route.component()

            case 'string':
                if (!customElements.get(route.component))
                    throw `Component name must be a valid custom element name. `
                        + `Did you import the correct component file?`
                
                let appElement = document.getElementsByTagName('lira-app')
                if (appElement.length <= 0)
                    throw `Can't find "lira-app" root component`

                // Reset the base tag to scroll to top
                appElement[0].innerHTML = ``

                // Wait 20ms to load the new content
                return setTimeout(
                    () => appElement[0].innerHTML = 
                        `<${route.component}></${route.component}>`
                    , 20)
                
            default:
                throw `Component attribute must be a function or a valid `
                    + `HTML custom element name`
        }
    }

    /**
     * Extracts the URL params based on the route
     * @param {object} route 
     * @returns {object}
     */
    getUrlParams (route) {
        const path = this.getPath()

        // Splits the route path and the URL path on their slashes
        const routePathParts = route.path.slice(1, -1).split('/')
        const urlPathParts = path.slice(1, -1).split('/')

        let params = {}

        // Iterate over the route parts to get the params' names
        routePathParts.forEach((part, index) => {
            // Test the regex to know if the part represents a param
            if (/\{[A-z0-9-._]+\}/.test(part)) {
                // Remove the { and } characters to get the name
                part = part.replace(/[\{\}]/g, '')
                params[part] = urlPathParts[index]
            }
        })

        return params
    }
}

/**
 * Route class, to set routes
 * @class Route
 */
class Route {
    /**
     * @constructor
     */
    constructor () {
        /** @private */
        this._routes = []
    }

    /**
     * Sets a route in the routes array
     * @param {string} path 
     * @param {string|function} component 
     */
    set (path, component) {
        // Validates the type of path attribute
        if (typeof path !== 'string')
            throw `Path attribute must be a string`

        // Validates the type of component attribute
        if (typeof component !== 'string' && typeof component !== 'function')
            throw `Component attribute must be a string or a function`

        // Adds the route to the list
        this._routes.push({ path, component })
    }
}

/**
 * Class to help with HTTP requests
 * @class HTTP
 */
class HTTP {
    /**
     * @constructor
     */
    constructor () {
        /** @private */
        this._params = {}
    }

    /**
     * Gets params of current HTTP request
     * @returns {object}
     */
    get params () {
        return this._params
    }

    /**
     * Set params of current HTTP request
     * @param {object} newParams
     */
    set params (newParams) {
        this._params = newParams
    }

    /**
     * Get app display-mode on current HTTP request
     * @returns {string}
     */
    get appMode () {
        const modes = ['browser', 'standalone', 'minimal-ui', 'fullscreen']

        for (let mode of modes) {
            // Checks for the media query that corresponds to the display-mode
            if (window.matchMedia(`(display-mode: ${mode})`).matches)
                return mode
        }
        
        return null
    }

    /**
     * Identifies when the display-mode has changed to a specific mode
     * @param {string} desiredMode 
     * @param {function} callback 
     */
    listenForAppMode (desiredMode, callback) {
        if (typeof desiredMode !== 'string')
            throw `App mode needs to be a string`

        if (typeof callback !== 'function')
            throw `Listener's callback needs to be a function`

        // Get the status of the desired mode
        window.matchMedia(`(display-mode: ${desiredMode})`)
            .addListener((e) => {
                // Does the current mode corresponds to the desired one?
                if (e.matches)
                    callback(e)
            })
    }


}

// Defines the default empty class for <lira-app> component
/** @class App */
class App extends HTMLElement { }


/**
 * Main class
 * @class Lira
 */
class Lira {
    /**
     * @constructor
     * @param {object} route 
     */
    constructor (route) {
        // Defines the custom element tag so it can be used in DOM
        window.customElements.define('lira-app', App)
        
        // Once app is started, start the router
        /** @private */
        this.router = new Router(route)
    }
}


/**
 * Instance creations and bootstrapping
 */
const route = new Route
const http = new HTTP
let lira = null
import('../src/config/routes.js').then(() => {
    // Start the app after importing
    lira = new Lira(route)
})

// Check if the app is set to use the PWA capabilities
if (config && ("pwa-enabled" in config) && config['pwa-enabled'] === true) {
    // Adds support to service worker and try to register it
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", function() {
            navigator.serviceWorker
                .register("service_worker.js")
                .then((res) => {})
                .catch((err) => {
                    console.error("Could not register service worker")
                })
        })
    }
}


/**
 * Exports
 * @exports route
 * @exports http
 */
export {
    route,
    http
}
