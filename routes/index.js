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
        const routeName = file.replace(/Routes\.js$|Router\.js$/i, '');

        // Convert to kebab-case for API paths
        const routePath = routeName
            .replace(/([a-z])([A-Z])/g, '$1-$2') // Handles camelCase
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2') // Handles PascalCase
            .toLowerCase();

        const route = require(path.join(__dirname, file));

        app.use(`/api/${routePath}`, route);

        console.log(`Route registered: /api/${routePath}`);
    });
}

module.exports = registerRoutes;
