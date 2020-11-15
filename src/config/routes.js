// Imports the route instance to set the App's routes
import { route } from '../../js/lira.js'

import '../view/index.js'
import '../view/errors/not-found.js'
import '../view/pages/parameter.js'
import '../view/pages/app-status.js'

route.set('func-route', () => {
    document.getElementsByTagName('lira-app')[0].innerHTML = `
        <h2>Function route</h2>
        <p>This route receives a JS function istead of a custom element.</p>
        <br/>
        <app-links></app-links>
    `
})

route.set('parameterized/{id}', 'param-page')

route.set('app-status', 'app-status')

route.set('/', 'app-index')

// Wildcard route for anything not listed above
route.set('*', 'not-found')