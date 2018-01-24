# Zendesk Ticket Issuer

Forwards tickets from github webhook to zendesk.

```
npm install
DOMAIN=yourname SECRET=secret node index
```

Testing:
```
curl http://localhost:3000 -XPOST -d @issuesEvent.json --header "Content-Type: application/json" --header "X-Hub-Signature: sha1=7d38cdd689735b008b3c702edd92eea23791c5f6"
```
