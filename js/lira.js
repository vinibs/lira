/**
 * @author Vinicius Baroni Soares
 * @version 2.1.0
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

                appElement[0].innerHTML =
                    `<${route.component}></${route.component}>`
                scroll(0,0)
                break;

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
            .addEventListener('change', (e) => {
                // Does the current mode corresponds to the desired one?
                if (e.matches)
                    callback(e)
            })
    }


}


/**
 * Base Lira's element
 * @class LiraElement
 */
class LiraElement extends HTMLElement {
    /**
     * @constructor
     * @param {boolean} useShadowRoot
     * @param {Array<string>} attributes
     */
    constructor (useShadowRoot = false, attributes = []) {
        super()

        const {
            filePath: currentPath,
            dirPath: currentDirectory
        } = getCallerInfo()
        this.currentPath = currentPath
        this.currentDirectory = currentDirectory

        this._useShadowRoot = useShadowRoot

        let domRoot = this

        if (useShadowRoot) {
            this.attachShadow({mode: 'open'})
            domRoot = this.shadowRoot
        }

        this._attributes = attributes
        attributes.map(attrName => {
            this[attrName] = this.getAttribute(attrName)
        })

        this._useStyle = false

        domRoot.addEventListener("slotchange", (event) => {
            this.onSlotChange(event)
        })
    }

    /**
     * Default observed attributes list definition (empty)
     */
    static get observedAttributes () {
        return []
    }

    /**
     * Handles changes on the class' attributes
     * @param {string} attrName
     * @param {any} oldVal
     * @param {any} newVal
     */
    attributeChangedCallback (attrName, oldVal, newVal) {
        if (oldVal !== newVal) {
            this[attrName] = newVal
            this._execRender()
        }
    }

    /**
     * Handles the element when it's attachd to the DOM
     */
    connectedCallback () {
        this._execRender()
    }

    /**
     * Default behavior on slot change
     * @param {Event} event
     */
    onSlotChange (event) {
        this._execRender
    }

    /**
     * Defines that the element should be styled with the given CSS file
     * @param {string} CssFileRelativePath
     */
    useStyle (cssFileRelativePath) {
        this._useStyle = true
        this._stylePath = parseFilePath(
            cssFileRelativePath,
            this.currentDirectory
        )

        styleLoader.loadStyle(this._stylePath)
    }

    /**
     * Executes the render() method. Used by the life cycle methods.
     */
    _execRender () {
        const renderWith = (styleContent) => {
            const renderCode = styleContent + this.render()

            if (this._useShadowRoot) {
                this.shadowRoot.innerHTML = renderCode
            } else {
                this.innerHTML = renderCode
            }
        }

        if (!this._useStyle) return renderWith('')

        styleLoader.getStyleContent(this._stylePath)
            .then((styles) => {
                const styleContent = `
                <style>
                    ${styles}
                </style>
                `
                renderWith(styleContent)
            })
            .catch((error) => {
                renderWith('')
            })
    }

    /**
     * Process the render() method of an array of elements to return the
     * whole resulting render code.
     * @param {Array} list
     * @param {Function} callback
     * @returns {string}
     */
    renderEach (list, callback) {
        let html = ''
        list.forEach((...args) => {
            html += callback(...args)
        })

        return html
    }

    /**
     * Base method to return the render code of the element
     * @returns {string}
     */
    render () {
        return ``
    }
}


/**
 * Gets the information about the caller of some function
 * @param {number} depthLevel
 * @returns {object}
 */
const getCallerInfo = (depthLevel = 1) => {
    let caller, callerFilePath, callerDirPath

    if (depthLevel < 1) depthLevel = 1

    // Ignore 1st depth level (the one who called this current function)
    depthLevel += 1
    const desiredDepthIndex = depthLevel + 1

    try {
        throw Error();
    } catch (err) {
        var stackLines = err.stack.split('\n')

        const extractCallerName = (line) => {
            const safariCallerName = line.match(/^[^@]+/)
            const chromeCallerName = line.match(/at [^\(]+/)

            if (safariCallerName) return safariCallerName

            if (!chromeCallerName?.length) return ''

            return chromeCallerName[0].trim().split(' ').at(-1)
        }

        const extractFilePath = (line) => {
            let path = line.match(/\(.+\)|@.+/)
            if (!path?.length) return ''

            return path[0]
                    .replace(/[\(\)\@]/g, '')
                    .replace(/https?:\/\/[^\/]+\//, '/')
                    .replace(/(\:\d+)+$/, '')
        }

        const extractDirectoryPath = (filePath) => {
            return filePath.replace(/\/[^\/]+$/, '')
        }

        let controlIndex = 0
        stackLines.map((line, index) => {
            if (index === 0 && line !== 'Error') controlIndex++

            if (controlIndex == desiredDepthIndex) {
                line = line.trim()
                caller = extractCallerName(line)
                callerFilePath = extractFilePath(line)
                callerDirPath = extractDirectoryPath(callerFilePath)
            }

            controlIndex++
        })

        return {
            caller: caller,
            filePath: callerFilePath,
            dirPath: callerDirPath
        }
    }
}

/**
 * Parse relative file paths according to a reference directory path
 * @param {string} relativeFilePath
 * @param {string} referenceDirPath
 * @returns {string}
 */
const parseFilePath = (relativeFilePath, referenceDirPath) => {
    if (relativeFilePath.charAt(0) === '/') return relativeFilePath

    if (relativeFilePath.substring(0, 2) === './') {
        return `${referenceDirPath}/${relativeFilePath.substring(2)}`
    }

    if (relativeFilePath.substring(0, 3) === '../') {
        const dirUps = relativeFilePath.match(/^(?:\.\.\/)+/g)[0]
        const dirUpCount = (dirUps.match(/\.\.\//g) || []).length
        const dirPathParts = referenceDirPath.split('/')
        const usedDirParts = dirPathParts.filter((item, index) => {
            return index < dirPathParts.length - dirUpCount
        })

        const usedDir = usedDirParts.join('/')
        const patterLength = '../'.length
        const usedFilePath = relativeFilePath.substring(
            patterLength * dirUpCount
        )

        return `${usedDir}/${usedFilePath}`
    }

    return relativeFilePath
}


/**
 * Class to load and cache styles' contents
 * @class StyleLoader
 */
class StyleLoader {
    cache = {}

    /**
     * Defines if the cache should be used
     * @returns {boolean}
     */
    _shouldUseCache () {
        return (
            config &&
            ('cache-styles' in config) &&
            !!config['cache-styles']
        )
    }

    /**
     * Triggers the load to populate the cache
     * @param {string} filePath
     */
    loadStyle (filePath) {
        this.getStyleContent(filePath)
    }

    /**
     * Gets the given style file's content from the cache or by loading it
     * @param {string} filePath
     * @returns {Promise<string>}
     */
    getStyleContent (filePath) {
        if (this._shouldUseCache()) {
            if (this.cache[filePath]) {
                return new Promise(resolve => resolve(this.cache[filePath]))
            }
        }

        return this._loadFile(filePath)
    }

    /**
     * Loads the style file and add it to cache
     * @param {string} filePath
     * @returns {Promise<string>}
     */
    _loadFile (filePath) {
        const returnPromise = new Promise(resolve => {
            return fetch(filePath)
                .then(response => response.text())
                .then(text => {
                    if (this._shouldUseCache()) {
                        this.cache[filePath] = text
                    }

                    resolve(text)
                    return text
                })
        })

        if (this._shouldUseCache()) {
            this.cache[filePath] = returnPromise
        }

        return returnPromise
    }
}


/**
 * Defines the default empty class for <lira-app> component
 * @class App
 */
class App extends LiraElement { }


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
const styleLoader = new StyleLoader
let lira = null
import('../src/config/routes.js').then(() => {
    // Start the app after importing
    lira = new Lira(route)
})

// Check if the app is set to use the PWA capabilities
if (config && ('pwa-enabled' in config) && !!config['pwa-enabled']) {
    // Adds support to service worker and try to register it
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker
                .register('service_worker.js')
                .then((res) => {})
                .catch((err) => {
                    console.error('Could not register service worker')
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
    http,
    LiraElement,
}
