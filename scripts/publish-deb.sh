#!/bin/sh

rsync -avz serverboards.deb -e ssh www.serverboards.io:/downloads/
