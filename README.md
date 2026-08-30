# WhatsApp Custom Link Redirector

A simple Node.js + Express app that creates links such as:

https://your-domain.vercel.app/MGmsg1

and redirects visitors to a WhatsApp chat.

## 1. Change the WhatsApp number

Open `links.json` and replace:

919876543210

with the WhatsApp number in international format, without `+`, spaces or dashes.

Example India:
919876543210

## 2. Change the message

Change the `message` value:

"message": "Hello"

You can leave it empty if you don't want a pre-filled message.

## 3. Add more links

Example:

"MGmsg3": {
  "number": "919999999999",
  "message": "I want more information"
}

Then the URL will be:

/MGmsg3

## 4. Deploy on Vercel

Upload this project to a GitHub repository, then import that repository into Vercel.

Vercel will install the dependencies and deploy the Node.js server.

## Important

This is an independent implementation of the same general idea. It does not copy or reproduce wpmsg.me's proprietary source code.
