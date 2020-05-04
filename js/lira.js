import config from '../src/config/config.js'

// Checks if the browser supports Custom Elements v1
if (!('customElements' in window))
    throw `Your browser is incompatible with this app`


/**
 * Router class, to do the app routing
 */
class Router {
    constructor (routeObj, liraObj) {
        // Listens to the hash change event
        window.addEventListener('hashchange', (ev) => {   
            this.run()
        })

        // Sets its Route() object, which contains the route list
        this.routeObj = routeObj

        this.liraObj = liraObj
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
        for (const i in this.routeObj.routes) {
            let route = this.formatPath(this.routeObj.routes[i])

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
        for (const i in this.routeObj.routes) {
            let route = this.formatPath(this.routeObj.routes[i])

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

                return appElement[0].innerHTML = `
                    <${route.component}></${route.component}>
                `
                
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
 */
class Route {
    constructor () {
        this.routes = []
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
        this.routes.push({ path, component })
    }
}

/**
 * Class to help with HTTP requests
 */
class HTTP {
    constructor () {
        this._params = {}
    }

    // Get params of current HTTP request
    get params () {
        return this._params
    }

    // Set params of current HTTP request
    set params (newParams) {
        this._params = newParams
    }

    // Get app display-mode on current HTTP request
    get appMode () {
        let appMode = null
        // Checks for the media query that corresponds to the display-mode
        if (window.matchMedia('(display-mode: browser)').matches)
            appMode = 'browser'
        else if (window.matchMedia('(display-mode: standalone)').matches)
            appMode = 'standalone'
        else if (window.matchMedia('(display-mode: minimal-ui)').matches)
            appMode = 'minimal-ui'
        else if (window.matchMedia('(display-mode: fullscreen)').matches)
            appMode = 'fullscreen'

        return appMode
    }


}

// Defines the default empty class for <lira-app> component
class App extends HTMLElement { }


/**
 * Main class
 */
class Lira {
    constructor (route) {
        // Defines the custom element tag so it can be used in DOM
        window.customElements.define('lira-app', App)
        
        // Once app is started, start the router
        this.router = new Router(route, this)
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
 */
export {
    route,
    http
}
