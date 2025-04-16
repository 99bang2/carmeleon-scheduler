#!/bin/bash
chmod -R 777 /root/.pm2
pm2-docker ecosystem.config.js --env production &
PM2_PID="$!"
if [[ -z $PM2_PID ]]; then
    exit 1
fi

while [[ -e /proc/$PM2_PID ]]; do
    HUP="true && "
    TERM="true && "

    if [[ -e /proc/$PM2_PID ]]; then
        HUP+="kill -HUP $PM2_PID && "
        TERM+="kill $PM2_PID && "
    fi

    HUP+="true"
    TERM+="true"

    trap "$HUP" HUP
    trap "$TERM" INT TERM

    wait
done

exit 0
