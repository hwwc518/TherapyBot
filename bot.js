'use strict'

var Config = require('./config')
var wit = require('./services/wit').getWit()
const request = require('request')

// LETS SAVE USER SESSIONS
var sessions = {}

var findOrCreateSession = function (fbid) {
    var sessionId

    // DOES USER SESSION ALREADY EXIST?
    Object.keys(sessions).forEach(k => {
	if (sessions[k].fbid === fbid) {
	    // YUP
	    sessionId = k
	}
    })

    // No session so we will create one
    if (!sessionId) {
	sessionId = new Date().toISOString()
	sessions[sessionId] = {
	    fbid: fbid,
	    context: {
		_fbid_: fbid
	    }
	}
    }

    return sessionId
}

var read = function (sender, message, reply) {
    console.log(message);
    console.log(message == 'hello');
    console.log(sender);
    if (message.includes('END')) {
	// Let's reply back hello
	delete sessions[sessionId];
	message = "Restarting session\nType gimme options";
	console.log("Restarting session\nType gimme options");
	sendTextMessage(sender,message);
	// reply(sender, message)
    } else {
	// Let's find the user
	var sessionId = findOrCreateSession(sender)
	// Let's forward the message to the Wit.ai bot engine
	// This will run all actions until there are no more actions left to do
	// wit.message
	wit.runActions(
	    sessionId, // the user's current session by id
	    message,  // the user's message
	    sessions[sessionId].context, // the user's session state
	    function (error, context) { // callback
		if (error) {
		    console.log('oops!', error)
		} else {
		    // Wit.ai ran all the actions
		    // Now it needs more messages
		    console.log('Waiting for further messages')

		    // Based on the session state, you might want to reset the session
		    // Example:
		    // if (context['done']) {
		    // 	delete sessions[sessionId]
		    // }

		    // Updating the user's current session state
		    sessions[sessionId].context = context
		}
	    })
    }
}

function sendTextMessage(sender, text) {
    let messageData = { text:text }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:Config.FB_VERIFY_TOKEN},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}


module.exports = {
    findOrCreateSession: findOrCreateSession,
    read: read,
}
