const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const request = require('request-promise');
const domain = process.env.DOMAIN
const secret = process.env.SECRET
const auth = process.env.AUTH
const githubKey = process.env.GITHUB_KEY
const apiKeyBase64 = new Buffer(auth).toString('base64')
const verifyGithubWebhook = require('verify-github-webhook').default;

if (!domain) {
  console.log('Please set DOMAIN env var, to your zendesk subdomain name.')
}
if (!secret) {
  console.log('Please set SECRET env var, to github webhook secret.')
}
if (!auth) {
  console.log('Please set AUTH env var, to zendesk auth string.')
}
if (!githubKey) {
  console.log('Please set GITHUB_KEY env var, to github secret.')
}

function isOrgUser(username_) {
  return request({
      uri: `https://api.github.com/orgs/${domain}/members`,
      qs: {
        access_token: githubKey
      },
      headers: {
        'User-Agent': 'Request-Promise'
      },
      json: true // Automatically parses the JSON string in the response
    })
    .then(function(users) {
      for (var i = 0; i < users.length; i++) {
        let username = users[i].login
        if (username === username_) {
          console.log('User is part of org!')
          return true
        }
      }
      return false
    })
    .catch(function(err) {
      console.log(err);
      return false
    });
}

function postToZendesk(body) {
  let issue = body.issue || body.pull_request
  let options = {
    method: 'POST',
    uri: `https://${domain}.zendesk.com/api/v2/tickets.json`,
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
  console.log(`Posting new issue to zendesk: ${JSON.stringify(options.body.ticket)}`)
  request(options)
    .then(function(parsedBody) {
      console.log('Success')
    })
    .catch(function(err) {
      console.log('Error: ' + err)
    });
}

app.use(bodyParser.json())

app.post('/', async (req, res) => {
  let body = req.body
  let signature = req.get('X-Hub-Signature')
  // if (!signature || !verifyGithubWebhook(signature, JSON.stringify(body), secret)) {
  //   return res.sendStatus(401)
  // }
  if (body.action === 'opened') {
    if (!await isOrgUser(body.sender.login)) {
      postToZendesk(body)
    } else {
      console.log('Not creating Zendesk ticket for Issue/PR from site admin.')
      return
    }
  } else {
    console.log(`Request for not implemented action received: ${body.action}`)
  }
  return res.sendStatus(200)
})

app.listen(process.env.PORT || 3000, () => console.log('App listening on port 3000!'))
