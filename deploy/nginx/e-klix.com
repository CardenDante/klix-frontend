# e-klix.com — Klix (docker-compose.prod.yml, project "klix").
#
#   /api  /socket  /uploads  /health -> Phoenix API (klix_api, 127.0.0.1:4400)
#   everything else                  -> Next.js web (klix_web, 127.0.0.1:3400)
#
# Install: copy to /etc/nginx/sites-available/, symlink into sites-enabled,
# then `certbot --nginx -d e-klix.com` adds TLS and the HTTP->HTTPS redirect.
# $connection_upgrade comes from /etc/nginx/conf.d/websocket-upgrade.conf.

server {
    server_name e-klix.com;
    listen 80;
    listen [::]:80;

    client_max_body_size 10M;

    location /api/ {
        proxy_pass http://127.0.0.1:4400;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    location /socket {
        proxy_pass http://127.0.0.1:4400;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_read_timeout 3600s;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:4400;
        proxy_set_header Host $host;
        expires 7d;
    }

    location = /health {
        proxy_pass http://127.0.0.1:4400;
    }

    location / {
        proxy_pass http://127.0.0.1:3400;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_read_timeout 120s;
    }
}
