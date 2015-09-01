#!/bin/sh

type unix2dos >/dev/null 2>&1 || { echo >&2 "Please install unix2dos first.  Aborting."; exit 1; }

DIR=${1:-./}

find $DIR -name \*.xml -exec unix2dos {} \;


