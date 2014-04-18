# Nginx Proxy Server Installation

## Overview
This document describes how to setup Nginx as a proxy server on the development and production servers (i.e. any server running Ubuntu 12.04 LTS).

In order to deploy Apache and Node on the same server, and have both listen on port 80, we have to setup a proxy server to correctly direct requests to the correct server. We will use Nginx to achieve this. 

**Key features** (modified from [Protecting Apache with an nginx Reverse Proxy](http://blog.zencoffee.org/2013/04/protecting-apache-with-an-nginx-reverse-proxy/): 

- Nginx listens on port 80 on the external facing interface (i.e. the one that internet users will connect to);
- Apache and Node will only listen on localhost (127.0.0.1) through port 8080 and 3000, respectively. Specifically, this means that Apache and Node will never directly serve content to anything outside the machine. 
- Nginx will reverse proxy connections from the internet into the local Apache and Node servers - i.e. Nginx will make a request to the servers for the requested content and then serve it to the requester. 
    - Apache will need some minor extra configuration to tell what the real IP address of the incoming connection are. This is accomplished with mod-rpaf, which lets Apache make use of the X-Forwarded-For HTTP header. 


## Setup Instructions 

1. Install Nginx with `sudo apt-get install nginx`
    - After installation, make sure that nginx is not running by `sudo service nginx stop`
2. Configure Nginx
    - The configuration file for Nginx lives in `/etc/nginx/nginx.conf`
        + Look at `example-nginx.conf` and `example-proxy.conf` inside the directory of this README for an example of what the confs should look like after following the steps in this section.
        + **Note**: To modify the files in this section, you will have to `sudo` e.g. `sudo vim nginx.conf`.
    - Inside the `http` section: Add the following entries, substituting in the correct `server_name` depending on which server you are deploying to:

        ```
        # Main Site
        server {
            listen      80;
            server_name dev.taleblazer.org;

            location / {
                proxy_pass  http://127.0.0.1:8080;
                include     /etc/nginx/conf.d/proxy.conf;
           }
        }
        # Analytics
        server {
            listen      80;
            server_name analytics.dev.taleblazer.org;
            
            location /{
                proxy_pass  http://127.0.0.1:3000;
                include     /etc/nginx/conf.d/proxy.conf;
            }
        }
        ```

    - Create `/etc/nginx/conf.d/proxy.conf` and add the following: 

        ```
        proxy_redirect off;
        proxy_set_header Host $host; 
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        client_max_body_size 8m;
        client_body_buffer_size 256k;
        proxy_connect_timeout 60;
        proxy_send_timeout 60;
        proxy_read_timeout 60;
        proxy_buffer_size 4k;
        proxy_buffers 32 256k;
        proxy_busy_buffers_size 512k;
        proxy_temp_file_write_size 256k;
        ```

3. Configure Apache
    - Install mod-rpaf to let Apache make use of the X-Forward-For header:
        - `sudo apt-get install libapache2-mod-rpaf`
    - Change `/etc/apache2/ports.conf` from:

        ```
        NameVirtualHost *:80
        Listen 80
        ```

        to:

        ```
        NameVirtualHost *:8080
        Listen 8080
        ```

    - Change `/etc/apache2/sites-available/taleblazer_server` from:

        ```
        <VirtualHost *:80>
        ```

        to 

        ```
        <VirtualHost *:8080>
        ```

    - Restart Apache with `sudo service apache2 restart`
        - **Note**: This will restart Apache to listen on port 8080. It will not be accessible via the normal port-less address  (e.g. dev.taleblazer.org) until you start Nginx.

4. Start Nginx with `sudo service nginx start`
    - Navigate to the TaleBlazer site and verify that it is running. If so, you have successfully configured Apache and Nginx.
   
5. Configure Node (TaleBlazer Analytics)
    - In `/var/www/taleblazer_analytics/config/config.js`, ensure that the production entry is:

        ```
        production: {
            db: dbConfig.production,
            HOST: '127.0.0.1',
            PORT: 3000,
            LOG_DIR: './logs/'
        }
        ```

        - Specifically, setting HOST to `127.0.0.1` ensures that it only serves requests to the local machine. Nginx will serve the requests on behalf of the Node server.
    - Restart Node by running `npm restart` in the root taleblazer_analytics directory.
        - Navigate to the TaleBlazer Analytics site and verify that it is running. If so, you have successfully configured Node and Nginx.

6. That's it. You're done!
   