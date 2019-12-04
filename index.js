const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const files = require('./lib/files');
const github = require('./lib/github');
const repo = require('./lib/repo');

// implement start up phase of console app

clear();

console.log(
    chalk.yellow(
        figlet.textSync('Ginit', { horizontalLayout: 'full' })
    )
)

// check if git repo exists already

if (files.directoryExists('.git')) {
    console.log(chalk.red('Already a Git repository!'));
    process.exit();
}


// handle logic of acquiring access token

const getGithubToken = async () => {
    // Fetch token from configstore
    let token = github.getStoredGithubToken();
    if (token) {
        return token;
    }
    // No token found, use credentials to access github account
    await github.setGithubCredentials();

    // register new token
    token = await github.registerNewToken();
    return token;
}

// get github credentials
const run = async () => {

    try {
        // Retrieve and set authentication token
        // User has to be logged in before the other steps are taken
        const token = await getGithubToken();
        github.githubAuth(token);

        // Create remote repository, returns the url
        const url = await repo.createRemoteRepo();

        // Create .gitignore file
        await repo.createGitIgnore();

        // Set up local repo and push to remote
        await repo.setupRepo(url);

        console.log(chalk.green('All done!'));
    } catch (err) {
        if (err) {
            switch (err.status) {
                // how did he know the status codes? 
                case 401:
                    console.log(chalk.red('Couldn\'t log you in. Please provide correct credentials/token.'))
                    break;
                case 422:
                    console.log(chalk.red('There already exists a remote repository with the same name.'));
                    break;
                default:
                    console.log(err);
            }
        }
    }
};

run();