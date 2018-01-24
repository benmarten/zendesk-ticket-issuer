const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const request = require('request-promise');
const apiKeyBase64 = new Buffer(`zendesk-viewer@leanplum.com:K4rmaDesk`).toString('base64')
const domain = process.env.DOMAIN
const secret = process.env.SECRET
const verifyGithubWebhook = require('verify-github-webhook').default;

if (!secret) {
  console.log('Please set SECRET env var, to github webhook secret.')
}
if (!domain) {
  console.log('Please set DOMAIN env var, to your zendesk subdomain name.')
}

function postToZendesk(body) {
  let issue = body.issue
  let options = {
    method: 'POST',
    uri: 'https://leanplum.zendesk.com/api/v2/tickets.json',
    body: {
      ticket: {
        subject: `[Github] ${issue.title}`,
        comment: {
          body: `A new Github Issue was submitted:\n\n ${issue.body}\n\n\n${issue.html_url}`
        }
      }
    },
    headers: {
      'Authorization': `Basic ${apiKeyBase64}`,
      "content-type": "application/json"
    },
    json: true
  }
  console.log(`Posting new issue to zendesk: ${options.body.ticket}`)
  request(options)
    .then(function(parsedBody) {
      console.log('Success')
    })
    .catch(function(err) {
      console.log('Error: ' + err)
    });
}

app.use(bodyParser.json())

app.post('/', (req, res) => {
  let body = req.body
  let signature = req.get('X-Hub-Signature')
  if (!signature || !verifyGithubWebhook(signature, JSON.stringify(body), secret)) {
    return res.sendStatus(401)
  }
  if (body.action === 'opened') {
    postToZendesk(body)
  } else {
    console.log(`Request for not implemented action received: ${body.action}`)
  }
  return res.sendStatus(200)
})

app.listen(process.env.PORT || 3000, () => console.log('App listening on port 3000!'))
