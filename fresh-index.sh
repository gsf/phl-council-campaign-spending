set -e

curl -XDELETE "$ESURL"
curl -XPUT "$ESURL" -d ''
curl -XPUT "$ESURL/record/_mapping" -d @mapping.json
curl -XPOST "$ESURL/record/_bulk" --data-binary @campaign-spending.out
