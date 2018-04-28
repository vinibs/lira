page = { // The variable 'page' must receive the object with the page data

    title: 'Lira', // Page title to be shown in the browser
    pageFile: 'home.page.html', // Relative to this JS file
    styleFile: 'home.page.css', // Relative to this JS file
    attr: {}, // Sets attributes accessible by the HTML and the page handler
    handler: function() {
        // app.ajax({
        //     url: 'src/pages/home/home.page.html',
        //     success: function(data) {
        //         alert(data.response);
        //     }
        // });
    } // JS function to be executed when the page is loaded.
};