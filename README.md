# Planbox

[![Build Status](https://travis-ci.org/civiclaboratories/planbox.png?branch=staging)](https://travis-ci.org/civiclaboratories/planbox)
[![Requirements Status](https://requires.io/github/civiclaboratories/planbox/requirements.png?branch=staging)](https://requires.io/github/civiclaboratories/planbox/requirements/?branch=staging)

Planbox is a platform for getting the word out about your planning projects.
Its beautiful and easy to use interface will help you get your project online
in no time.

## Features

* Create project
* Quickly and easily edit details
* Timeline of progress


## Requirements

Describe the technology stack and any dependencies.

## Local Setup

### Clone this repo

    git clone git@github.com:openplans/planbox.git

### Install dependencies

     cd planbox
     virtualenv env
     source env/bin/activate
     pip install -r requirements.txt
     bower install
     cp src/planbox/local_settings.py.template src/planbox/local_settings.py

### Start your local server

     src/manage.py runserver

### Configure your S3 bucket

This is used for uploading images and attachments. Add a
[CORS Configuration](http://docs.aws.amazon.com/AmazonS3/latest/dev/cors.html)
that roughly matches this:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
    <CORSRule>
        <AllowedOrigin>http://localhost:8000</AllowedOrigin>
        <AllowedMethod>GET</AllowedMethod>
        <AllowedMethod>PUT</AllowedMethod>
        <AllowedMethod>POST</AllowedMethod>
        <AllowedMethod>DELETE</AllowedMethod>
        <MaxAgeSeconds>3000</MaxAgeSeconds>
        <AllowedHeader>*</AllowedHeader>
    </CORSRule>
</CORSConfiguration>
```

Note that you will have to add an `AllowedOrigin` element for each domain your
application will run on. You can use wildcard asterisks (`*`) in the origin if
you wish, but it will mean that anyone can write to your bucket.

## Deploy to Heroku

### Create the app

1. Create a Heroku app for your Hatch git repo `heroku apps:create my-app-name`
2. Make sure you add the following Heroku Add-ons
  * Postgresql
  * Rediscloud (or your favorite Redis add-on)
  * Heroku Scheduler

### Create addons

Required:
* Production PostgreSQL (necessary for PostGIS)
* Redis Cloud
* Postmark

Recommended:
* Log Entries
* PG Backups

```bash
    heroku addons:add \
        heroku-postgresql:standard-0 \
        logentries:tryit \
        pgbackups:auto-week \
        postmark:10k \
        rediscloud:25
```


### Set up the environment

```bash
    heroku config:set IS_HEROKU=True \
                      BUILDPACK_URL="https://github.com/heroku/heroku-buildpack-multi.git" \
                      DEBUG=False \
                      EMAIL_HOST=$(heroku config:get POSTMARK_SMTP_SERVER) \
                      EMAIL_HOST_PASSWORD=$(heroku config:get POSTMARK_API_TOKEN) \
                      EMAIL_HOST_USER=$(heroku config:get POSTMARK_API_KEY) \
                      EMAIL_PORT=25 \
                      EMAIL_USE_TLS=True
```

### Set up contact info

```bash
    heroku config:set CONTACT_EMAIL="hello@yourdomain.com" \
                      ADMINS="dev@yourdomain.com"
```

### Set up Shareabouts integration

1. Create a user, a client, and a remote client user on the API
2. Set the environment variables

    ```bash
    heroku config:set SHAREABOUTS_HOST=yourshareabouts.herokuapp.com \
                      SHAREABOUTS_USERNAME=planbox \
                      SHAREABOUTS_PASSWORD=AJasdfAWgfJ324v9A953 \
                      SHAREABOUTS_CLIENT_ID=fed321bc0987af654ed3 \
                      SHAREABOUTS_CLIENT_SECRET=1234abcd5678ef90123abc456de789f12345ab67
    ```

### Set up AWS S3

1. Create your bucket on S3
2. Add the information to your environment

    ```bash
    heroku config:set S3_MEDIA_BUCKET=your-media-bucket \
                      AWS_ACCESS_KEY=ABCDEFG12HIGJKMN45OP \
                      AWS_SECRET_KEY="a123bcDEFghIJ6789KlmnOpqwSTU34V123WX+2yz"
    ```

3. Enter in a CORS configuration that looks like:

    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
        <CORSRule>
            <AllowedOrigin>https://yourdomain.org</AllowedOrigin>
            <AllowedOrigin>https://*.yourdomain.org</AllowedOrigin>
            <AllowedOrigin>https://yourapp.herokuapp.com</AllowedOrigin>
            <AllowedMethod>GET</AllowedMethod>
            <AllowedMethod>PUT</AllowedMethod>
            <AllowedMethod>POST</AllowedMethod>
            <AllowedMethod>DELETE</AllowedMethod>
            <MaxAgeSeconds>3000</MaxAgeSeconds>
            <AllowedHeader>*</AllowedHeader>
        </CORSRule>
    </CORSConfiguration>
    ```

## Supported Browsers

### Desktop
* Chrome (latest)
* Firefox (latest)
* Safari (latest)
* Internet Explorer (8-10)

### Mobile
* IOS Safari 6+
* Android Browser 4+
* Chrome


## Google Analytics configuration

Planbox stores the request domain information using two additional variables
(dimensions):

* Dimension 1 : Domain
* Dimension 2 : Root Path

Refer to the Google Analytics documentation on [setting up custom dimensions](https://developers.google.com/analytics/devguides/platform/customdimsmets)
to configure your account appropriately.


## Copyright

Copyright (c) 2014 OpenPlans
