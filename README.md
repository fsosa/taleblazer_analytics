# Analytics Installation

1. Install Node **v.0.10.18** or higher.
    - If you've installed Titanium Studio, then you most likely have already installed Node and NPM. Otherwise, check the [official Node installation instructions](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager)
    - For Ubuntu, you will most likely have to run the following commands (**but check the official instructions first**):
      ```  
      sudo add-apt-repository ppa:chris-lea/node.js
      sudo apt-get update
      sudo apt-get install python-software-properties python g++ make nodejs
      ```
    - Verify that `node -v ` returns `0.10.xx` and `npm -v` returns `1.4.x`

2. Checkout the analytics server from Git.
    - HTTPS: `https://YOUR-BITBUCKET-USERNAME@bitbucket.org/taleblazer/taleblazer_analytics.git`
    - SSH: `git clone git@bitbucket.org:taleblazer/taleblazer_analytics.git`

3. Configure your database connection.
    1. In the `config` directory, copy `config.example.json` to `config.json`.
    2. Fill in the details for the environment that you're in, according to your purpose:
        - **For development purposes**: Fill in 'development' and 'test' so that you can run tests locally. Make sure that the database for 'test' is **different** from the 'development' database, as running tests clears and remakes analytics tables every time they are run.
        - **For deployment purposes**: Only fill in the 'production' entry, and delete the rest. **DO NOT INCLUDE THE TEST ENVIRONMENT***
        - *NOTE*: You can usually get the database details from the `database.php` in `app/Config` of the [TaleBlazer Server repository]( https://bitbucket.org/taleblazer/taleblazer_server).

4. (**For development purposes**) Set up testing
    1. Install Mocha: `npm install mocha -g` 
        - The `-g` flag installs it globally and is required for testing.
    2. Run tests by running `npm test` in the top-level analytics directory.All tests should pass.

5. (**For deployment purposes**) Install Forever and set the NODE_ENV environment variable.
    1. Install Forever: `npm install forever -g`
    2. Set the NODE_ENV variable via the following terminal commands:
    ```
    $ echo export NODE_ENV=production >> ~/.bash_profile
    $ source ~/.bash_profile
    ```

6. Run the server
    - Development: `node server.js`
    - Deployment: `forever start -l forever.log -o out.log -e err.log -a server.js`
        - You can stop the server with `forever stop server.js`

        