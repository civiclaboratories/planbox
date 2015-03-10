"""
Django settings for planbox project.

For more information on this file, see
https://docs.djangoproject.com/en/1.6/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.6/ref/settings/
"""

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import os
SETTINGS_DIR = os.path.dirname(__file__)
BASE_DIR = os.path.dirname(SETTINGS_DIR)


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.6/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'qfiz+=8vnm5v=so@n@sj@k7dnhr$7ugpr1=st14#cymkoop3in'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

TEMPLATE_DEBUG = True

ALLOWED_HOSTS = []
KNOWN_HOSTS = ['localhost:8000', '127.0.0.1:8000']


# Application definition

INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.gis',

    'jstemplate',
    'djangobars',
    'genericadmin',
    'rest_framework',
    'django_ace',
    'django_object_actions',
    'raven.contrib.django.raven_compat',
    'sparklines',

    'moonclerk',
    'custom_domains',
    'password_reset',
    'planbox_ui',
    'planbox_data',
    'shareabouts_integration',
)

HANDLEBARS_APP_DIRNAMES = ['jstemplates']
CANONICAL_ROOT = ''

TEMPLATES_PROFILE = 'templates'
DEFAULT_PROJECT_TEMPLATE = 'templates/default'
TRIAL_DAYS = 15
TRIAL_DURATION = 60 * 60 * 24 * TRIAL_DAYS

LOGIN_URL = 'app-signin'
LOGIN_REDIRECT_URL = 'app-user-profile'
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

MIDDLEWARE_CLASSES = (
    'django.middleware.gzip.GZipMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',

    'custom_domains.middleware.CustomDomainResolvingMiddleware',
)

ROOT_URLCONF = 'planbox.urls'

WSGI_APPLICATION = 'planbox.wsgi.application'

TEMPLATE_CONTEXT_PROCESSORS = (
    "django.contrib.auth.context_processors.auth",
    "django.core.context_processors.debug",
    "django.core.context_processors.i18n",
    "django.core.context_processors.media",
    "django.core.context_processors.request",
    "django.core.context_processors.tz",
    "django.contrib.messages.context_processors.messages",

    "custom_domains.context_processors.static",
    "planbox_ui.context_processors.settings",
)

SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"


# Database
# https://docs.djangoproject.com/en/1.6/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.spatialite',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}

# Email
# https://docs.djangoproject.com/en/dev/ref/settings/#email-backend

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
EMAIL_ADDRESS = 'info@example.com'


# Internationalization
# https://docs.djangoproject.com/en/1.6/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.6/howto/static-files/

# Make filepaths relative to settings.
def rel_path(*subs):
    """Make filepaths relative to this settings file"""
    root_path = os.path.dirname(os.path.abspath(__file__))
    return os.path.abspath(os.path.join(root_path, *subs))

STATIC_ROOT = rel_path('../../staticfiles')
STATIC_URL = '/static/'
INTERNAL_IPS = ('127.0.0.1',)


# If we need to load additional settings...

def load_settings(settings_filename):
    settings_filename = os.path.join(SETTINGS_DIR, settings_filename)
    with open(settings_filename, 'r') as settings_file:
        exec(settings_file.read(), globals())


# Use the heroku settings, if we're on Heroku

if os.environ.get('IS_HEROKU'):
    load_settings('heroku_settings.py')


# Local settings overrides

try:
    load_settings('local_settings.py')
except IOError:
    pass

