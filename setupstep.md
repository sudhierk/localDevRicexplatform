2rvsource ~/.profile

Install necessary packages/ go binaries
-------------------------------------
go get -u github.com/pressly/goose/cmd/goose
go get -u github.com/gin-gonic/gin
go get -u github.com/jinzhu/gorm
go get -u github.com/sirupsen/logrus
go get -u github.com/swaggo/files
go get -u github.com/swaggo/gin-swagger


export KEY_PATH=/home/administrator/project/go/src/gitlab.com/riceexchangeplatform/riceex-backend/keys/
export SENDGRID_API_KEY=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
export APP_DB="postgres://postgres:1234@localhost"


PgAdmin Installation Steps
------------------------------------------------------------

to start pgAdmin4
===================

link :https://www.e2enetworks.com/help/knowledge-base/install-pgadmin-4-on-ubuntu-16-04/

1- apt-get install virtualenv python-pip libpq-dev python-dev
2- virtualenv pgadmin4
3- cd pgadmin4
4- source bin/activate
5- wget https://ftp.postgresql.org/pub/pgadmin/pgadmin4/v1.4/pip/pgadmin4-1.4-py2.py3-none-any.whl
6- pip install pgadmin4-1.4-py2.py3-none-any.whl 
7- echo "SERVER_MODE = False" >> lib/python2.7/site-packages/pgadmin4/config_local.py
8- python lib/python2.7/site-packages/pgadmin4/pgAdmin4.py   //---> this is to start pgAdmin4 server
9- Access at http://localhost:5050​