// Imports the route instance to set the App's routes
import { route } from '../../js/lira.js'

import '../view/index.js'
import '../view/errors/not-found.js'
import '../view/pages/parameter.js'
import '../components/links.js'

route.set('func-route', () => {
    console.log('This route runs a function')

    document.getElementsByTagName('lira-app')[0].innerHTML = `
        <h2>Function route</h2>
        <app-links></app-links>
    `
})

route.set('parameterized/{id}', 'param-page')

route.set('/', 'app-index')

// Wildcard route for anything not listed above
route.set('*', 'not-found')