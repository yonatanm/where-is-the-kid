sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports 5000
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

# nvm
# https://gist.github.com/winuxue/cfef08e2f5fe9dfc16a1d67a4ad38a01

PUPPETEER_PRODUCT=firefox npm i puppeteer
