#!/bin/zsh

SERVER=aws-jp.billc.io
USER=root

ssh -i ~/.ssh/billc-jp.pem $USER@$SERVER 'bash -s' < bin/remote_deploy.sh