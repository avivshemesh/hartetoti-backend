const fs = require('fs');
const path = require('path');
const express = require('express');

function registerRoutes(app) {
    const routeFiles = fs.readdirSync(__dirname)
        .filter(file =>
            file !== 'index.js' &&
            (file.endsWith('Routes.js') || file.endsWith('Router.js'))
        );

    routeFiles.forEach(file => {
        const routeName = file.replace(/Routes\.js$|Router\.js$/i, '').toLowerCase();

        // Convert from camelCase to kebab-case for API paths
        const routePath = routeName
            .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
            .toLowerCase();

        const route = require(path.join(__dirname, file));

        app.use(`/api/${routePath}`, route);

        console.log(`Route registered: /api/${routePath}`);
    });
}

module.exports = registerRoutes;
