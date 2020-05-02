// Imports the route instance to set the App's routes
import { route } from '../../js/lira.js'

import '../view/index.js'
import '../view/errors/not-found.js'
import '../components/links.js'

route.set('teste', () => {
    console.log('acessei o teste')

    document.getElementsByTagName('lira-app')[0].innerHTML = `
        <h2>Teste!</h2>
        <app-links></app-links>
    `
})

route.set('teste/{id}', (params) => {
    console.log('acessei o teste com parâmetros', params)

    document.getElementsByTagName('lira-app')[0].innerHTML = `
        <h2>Parâmetros!</h2>
        <app-links></app-links>
    `
})

route.set('/', 'app-index')

// Wildcard route for anything not listed above
route.set('*', 'not-found')