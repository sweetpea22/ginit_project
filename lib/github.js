const Configstore = require('configstore');
const CLI = require('clui');
const Octokit = require('@octokit/rest');
const Spinner = CLI.Spinner;

const inquirer = require('./inquirer');
const pkg = require('../package.json');

const conf = new Configstore('pkg.name');

let octokit;

module.exports = {
    // if token exists
    getInstance: () => {
        return octokit;
    },

    getStoredGithubToken: () => {
        return conf.get('github.token');
    },

    // set up oauth
    githubAuth: token => {
        octokit = new Octokit({
            auth: token
        });
    },

    // create new token if none
    setGithubCredentials: async () => {
        // credentials by prompting user, store in octokit instance
        const credentials = await inquirer.askGithubCredentials();
        octokit = new Octokit({
            auth: {
                username: credentials.username,
                password: credentials.password,
            }
        });
    },

    registerNewToken: async () => {
        // create spinner
        const status = new Spinner('Authenticating you, please wait...');
        status.start();
        try {

            // pass an auth option to octokit constructor to enable authenticated requests
            const response = await octokit.oauthAuthorizations.createAuthorization({
                scopes: ['user', 'public_repo', 'repo', 'repo:status'],
                note: 'ginit, the command-line tool for initializing Git repositories',
            });

            // attempt to register the access token for application
            const token = response.data.token;

            // if we get a token, put it in the configstore for next time
            // return the token
            if (token) {
                conf.set('github.token', token);
                return token;
            } else {
                throw new Error('Missing Token', 'Github token was not found.');
            }
        } catch (err) {
            throw err;
        } finally {
            status.stop();
        }
    }
};
