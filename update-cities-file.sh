#!/bin/bash
URL="http://download.geonames.org/export/dump/"
FILENAME="cities1000.zip"

rm $FILENAME
wget $URL$FILENAME

# Unzip and overwrite existing files
unzip -o $FILENAME

# Delete zip now it's uncompressed
rm $FILENAME

