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
    2. Fill in the details for the environment that you're in and remove all other environments.            
        - If you're deploying to production or dev, get the details from the `database.php` in `app/Config` of the [TaleBlazer Server repository](https://bitbucket.org/taleblazer/taleblazer_server).
        - IMPORTANT: For production and dev environments, only leave ONE entry in this file. **DO NOT INCLUDE THE TEST ENVIRONMENT***

4.
    

        