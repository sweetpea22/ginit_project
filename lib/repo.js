const fs = require('fs');
const CLI = require('clui');

// simple-git that will run the git executable via chainable methods (promises)
// need to call simple-git! 
const git = require('simple-git/promise')();
const Spinner = CLI.Spinner;
const _ = require('lodash');

const inquirer = require('./inquirer');
const gh = require('./github');

module.exports = {

    createRemoteRepo: async () => {

        // get details needed to create the repo

        // octokit instance
        const github = gh.getInstance();

        // data to populate repo inputs
        const answers = await inquirer.askRepoDetails();
        const data = {
            name: answers.name,
            description: answers.description,
            // boolean
            private: (answers.visibility === 'private'),
        };

        const status = new Spinner('Creating remote repository....');
        status.start();

        // create the repo
        try {
            //call function that creates repo for us
            const response = await github.repos.createForAuthenticatedUser(data);
            // return a url to local git repository
            return response.data.ssh_url;
        } catch (err) {
            throw err;
        } finally {
            status.stop();
        }
    },

    createGitIgnore: async () => {
        const filelist = _.without(fs.readdirSync('.'), '.git', '.gitignore');

        if (filelist.length) {
            const answers = await inquirer.askIgnoreFiles(filelist);

            // if there is stuff to ignore, add it to the file
            if (answers.ignore.length) {
                // join the ignore choices by newline
                fs.writeFileSync('.gitignore', answers.ignore.join('\n'));
            } else {
                Touch('.gitignore');
            }
            // even if nothing to ignore, create anyway
        } else {
            Touch('.gitignore');
        }
    },

    // uses git pkg to set up repo
    setupRepo: async url => {
        const status = new Spinner('Initializing local repository and pushing to remote...');
        status.start();

        // call git methods which returns a promise
        return git.init()
            .then(() => git.add('.gitignore'))
            .then(() => git.add('./*'))
            .then(() => git.commit('Initial commit'))
            // add remote origin
            .then(() => git.addRemote('origin', url))
            .then(() => git.push('origin', 'master'))
            // read more about this... finally 
            .finally(status.stop());
    }
};